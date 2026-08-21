import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { dbConnect } from "../lib/mongodb.js";
import { getUserFromReq } from "../lib/auth.js";
import {
  clearWorkOSCookie,
  getWorkOSUserFromReq,
  setWorkOSCookie,
  signWorkOSSession,
} from "../lib/workspaceAuth.js";
import WorkOSProject from "../models/WorkOSProject.js";
import WorkOSUser from "../models/WorkOSUser.js";

function cleanMemory(memory = []) {
  if (!Array.isArray(memory)) return [];
  return memory
    .slice(0, 250)
    .map((item) => ({
      clientId: String(item?.id || item?.clientId || `memory-${Date.now()}-${Math.random()}`),
      text: String(item?.text || "").trim().slice(0, 12000),
      source: String(item?.source || "Ashes").trim().slice(0, 80),
      kind: ["memory", "conversation", "decision", "handoff"].includes(item?.kind) ? item.kind : "memory",
      createdAt: item?.createdAt ? new Date(item.createdAt) : new Date(),
    }))
    .filter((item) => item.text);
}

function toClient(project) {
  return {
    id: project.clientId,
    name: project.name,
    goal: project.goal || "",
    memory: (project.memory || []).map((item) => ({
      id: item.clientId,
      text: item.text,
      source: item.source,
      kind: item.kind || "memory",
      createdAt: new Date(item.createdAt).getTime(),
    })),
    updatedAt: project.updatedAt,
  };
}

function toPublicProject(project) {
  return {
    id: project.clientId,
    name: project.name,
    goal: project.goal || "",
    memory: (project.memory || []).slice(0, 50).map((item) => ({
      id: item.clientId,
      text: item.text,
      source: item.source,
      kind: item.kind || "memory",
      createdAt: new Date(item.createdAt).getTime(),
    })),
    updatedAt: project.updatedAt,
  };
}

async function claimLegacyProjects(req, brainUser) {
  const legacy = getUserFromReq(req);
  if (!legacy?.id || !legacy?.email) return 0;
  if (String(legacy.email).toLowerCase() !== String(brainUser.email).toLowerCase()) return 0;

  const alreadyOwned = await WorkOSProject.countDocuments({ owner: brainUser._id });
  if (alreadyOwned > 0) return 0;

  const result = await WorkOSProject.updateMany(
    { owner: legacy.id },
    { $set: { owner: brainUser._id } }
  );
  return result.modifiedCount || 0;
}

async function handleBrainAuth(req, res, action) {
  if (action === "me") {
    const session = getWorkOSUserFromReq(req);
    if (!session) return res.status(401).json({ error: "Not authenticated" });
    return res.status(200).json({ id: session.id, name: session.name, email: session.email, account: "workos" });
  }

  if (action === "logout") {
    clearWorkOSCookie(res);
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  await dbConnect();

  if (action === "signup") {
    const name = String(req.body?.name || "").trim().slice(0, 120);
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password are required." });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

    const existing = await WorkOSUser.findOne({ email });
    if (existing) return res.status(409).json({ error: "A Brain account with this email already exists." });

    const user = await WorkOSUser.create({ name, email, password: await bcrypt.hash(password, 10) });
    const migratedProjects = await claimLegacyProjects(req, user);
    const token = signWorkOSSession({ id: user._id.toString(), name: user.name, email: user.email });
    setWorkOSCookie(res, token);
    return res.status(201).json({ id: user._id, name: user.name, email: user.email, account: "workos", migratedProjects });
  }

  if (action === "login") {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const user = await WorkOSUser.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid Brain email or password." });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid Brain email or password." });

    const migratedProjects = await claimLegacyProjects(req, user);
    const token = signWorkOSSession({ id: user._id.toString(), name: user.name, email: user.email });
    setWorkOSCookie(res, token);
    return res.status(200).json({ id: user._id, name: user.name, email: user.email, account: "workos", migratedProjects });
  }

  return res.status(404).json({ error: "Unknown Brain auth action" });
}

export default async function handler(req, res) {
  const authAction = String(req.query?.auth || "");
  if (authAction) {
    try {
      return await handleBrainAuth(req, res, authAction);
    } catch (error) {
      return res.status(500).json({ error: error?.message || "Brain authentication failed" });
    }
  }

  const publicShare = String(req.query?.share || "").trim();
  if (req.method === "GET" && publicShare) {
    try {
      await dbConnect();
      const project = await WorkOSProject.findOne({ shareToken: publicShare, shareEnabled: true });
      if (!project) return res.status(404).json({ error: "Shared Brain not found or sharing was disabled." });
      return res.status(200).json({ project: toPublicProject(project), shared: true });
    } catch (error) {
      return res.status(500).json({ error: error?.message || "Could not load shared Brain" });
    }
  }

  const authUser = getWorkOSUserFromReq(req);
  if (!authUser) return res.status(401).json({ error: "Not authenticated" });

  try {
    await dbConnect();

    if (req.method === "GET") {
      const projects = await WorkOSProject.find({ owner: authUser.id }).sort({ updatedAt: -1 });
      return res.status(200).json({ projects: projects.map(toClient) });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { action } = req.body || {};

    if (action === "sync") {
      const incoming = Array.isArray(req.body.projects) ? req.body.projects.slice(0, 50) : [];
      const keepIds = [];

      for (const project of incoming) {
        const clientId = String(project?.id || "").trim().slice(0, 160);
        const name = String(project?.name || "Untitled project").trim().slice(0, 120);
        if (!clientId) continue;
        keepIds.push(clientId);

        await WorkOSProject.findOneAndUpdate(
          { owner: authUser.id, clientId },
          {
            $set: {
              name,
              goal: String(project?.goal || "").trim().slice(0, 4000),
              memory: cleanMemory(project?.memory),
            },
            $setOnInsert: { owner: authUser.id, clientId },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      if (req.body.replace === true) {
        await WorkOSProject.deleteMany({ owner: authUser.id, clientId: { $nin: keepIds } });
      }

      const projects = await WorkOSProject.find({ owner: authUser.id }).sort({ updatedAt: -1 });
      return res.status(200).json({ ok: true, projects: projects.map(toClient) });
    }

    if (action === "share") {
      const id = String(req.body.id || "").trim();
      if (!id) return res.status(400).json({ error: "Missing project id" });
      const project = await WorkOSProject.findOne({ owner: authUser.id, clientId: id });
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (!project.shareToken) project.shareToken = crypto.randomBytes(24).toString("base64url");
      project.shareEnabled = true;
      await project.save();
      return res.status(200).json({
        ok: true,
        shareUrl: `https://www.ashesstack.cloud/workspace/share/${project.shareToken}`,
      });
    }

    if (action === "unshare") {
      const id = String(req.body.id || "").trim();
      if (!id) return res.status(400).json({ error: "Missing project id" });
      await WorkOSProject.updateOne({ owner: authUser.id, clientId: id }, { $set: { shareEnabled: false } });
      return res.status(200).json({ ok: true });
    }

    if (action === "delete") {
      const id = String(req.body.id || "").trim();
      if (!id) return res.status(400).json({ error: "Missing project id" });
      await WorkOSProject.deleteOne({ owner: authUser.id, clientId: id });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Workspace request failed" });
  }
}

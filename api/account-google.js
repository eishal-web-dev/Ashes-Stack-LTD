import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import { dbConnect } from "../lib/mongodb.js";
import WorkOSUser from "../models/WorkOSUser.js";
import WorkOSSsoCode from "../models/WorkOSSsoCode.js";
import RoboLabProject from "../models/RoboLabProject.js";
import {
  getWorkOSUserFromReq,
  setWorkOSCookie,
  signRoboLabSession,
  signWorkOSSession,
  verifyRoboLabSession,
} from "../lib/workspaceAuth.js";
import { recordAnalytics } from "../lib/analytics.js";

const client = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;
const SAYIT_CALLBACK = "https://aireply-dusky.vercel.app/auth/ashes/callback";
const CONNECT_CALLBACK = "https://ashes-connect-app-ash-d0707d97.vercel.app/auth/ashes/callback";
const ROBOLAB_CALLBACK = "https://robotsimulation.vercel.app/auth/ashes/callback";
const ROBOLAB_ORIGIN = "https://robotsimulation.vercel.app";
const SSO_ROOT_SECRET = process.env.WORKOS_JWT_SECRET || `${process.env.JWT_SECRET || "dev-secret-change-me"}:ashes-work-os`;

function allowedReturnUrl(value) {
  return [SAYIT_CALLBACK, CONNECT_CALLBACK, ROBOLAB_CALLBACK].includes(value) ? value : "";
}

function robolabPassword(userId) {
  const digest = crypto
    .createHmac("sha256", SSO_ROOT_SECRET)
    .update(`robolab:${String(userId)}`)
    .digest("base64url");
  return `Rl!${digest}`;
}

function setRoboLabCors(req, res) {
  const origin = String(req.headers.origin || "");
  if (!origin || origin === ROBOLAB_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", ROBOLAB_ORIGIN);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
}

function getBearer(req) {
  const auth = String(req.headers.authorization || "");
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
}

function projectRow(doc) {
  return {
    id: doc._id.toString(),
    user_id: doc.userId,
    title: doc.title,
    description: doc.description || "",
    thumbnail_url: doc.thumbnailUrl || null,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    circuit_data: doc.circuitData || {},
    code_data: doc.codeData || "",
    world_data: doc.worldData || {},
    is_public: Boolean(doc.isPublic),
    created_at: doc.createdAt?.toISOString?.() || new Date().toISOString(),
    updated_at: doc.updatedAt?.toISOString?.() || new Date().toISOString(),
  };
}

function normalizeProjectSnapshot(value) {
  const snap = value && typeof value === "object" ? value : {};
  return {
    title: String(snap.title || "Untitled Project").slice(0, 180),
    description: String(snap.description || "").slice(0, 4000),
    tags: Array.isArray(snap.tags) ? snap.tags.map((x) => String(x).slice(0, 60)).slice(0, 30) : [],
    circuitData: {
      nodes: Array.isArray(snap.nodes) ? snap.nodes : [],
      edges: Array.isArray(snap.edges) ? snap.edges : [],
    },
    codeData: String(snap.code || "").slice(0, 250000),
    worldData: snap.world && typeof snap.world === "object" ? snap.world : {},
  };
}

async function handleRoboLabProjects(req, res) {
  setRoboLabCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const origin = String(req.headers.origin || "");
  if (origin && origin !== ROBOLAB_ORIGIN) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  const session = verifyRoboLabSession(getBearer(req));
  if (!session?.id) {
    return res.status(401).json({ error: "RoboLab session expired. Sign in with Ashes again." });
  }

  await dbConnect();
  const userId = String(session.id);

  if (req.method === "GET") {
    const id = String(req.query?.id || "").trim();
    if (id) {
      if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid project id" });
      const doc = await RoboLabProject.findOne({ _id: id, userId });
      return res.status(200).json({ project: doc ? projectRow(doc) : null });
    }
    const docs = await RoboLabProject.find({ userId }).sort({ updatedAt: -1 }).limit(250);
    return res.status(200).json({ projects: docs.map(projectRow) });
  }

  if (req.method === "POST") {
    const snapshot = normalizeProjectSnapshot(req.body?.snapshot);
    const doc = await RoboLabProject.create({ userId, ...snapshot });
    return res.status(201).json({ project: projectRow(doc) });
  }

  if (req.method === "PATCH") {
    const id = String(req.body?.id || "").trim();
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid project id" });
    const update = {};
    if (req.body?.snapshot) Object.assign(update, normalizeProjectSnapshot(req.body.snapshot));
    if (typeof req.body?.is_public === "boolean") update.isPublic = req.body.is_public;
    const doc = await RoboLabProject.findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true });
    if (!doc) return res.status(404).json({ error: "Project not found" });
    return res.status(200).json({ project: projectRow(doc) });
  }

  if (req.method === "DELETE") {
    const id = String(req.body?.id || "").trim();
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid project id" });
    const deleted = await RoboLabProject.findOneAndDelete({ _id: id, userId });
    if (!deleted) return res.status(404).json({ error: "Project not found" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

async function handleSsoIssue(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const returnUrl = allowedReturnUrl(String(req.query?.return || ""));
  if (!returnUrl) return res.status(400).json({ error: "Invalid return URL" });

  const session = getWorkOSUserFromReq(req);
  if (!session) {
    const next = `/api/account-google?sso=issue&return=${encodeURIComponent(returnUrl)}`;
    return res.redirect(302, `/login?next=${encodeURIComponent(next)}`);
  }

  await dbConnect();
  await WorkOSSsoCode.deleteMany({ expiresAt: { $lte: new Date() } });
  const prefix = returnUrl === ROBOLAB_CALLBACK ? "robolab." : "";
  const code = `${prefix}${crypto.randomBytes(32).toString("hex")}`;
  await WorkOSSsoCode.create({
    code,
    userId: session.id,
    name: session.name || "",
    email: session.email,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  const redirect = new URL(returnUrl);
  redirect.searchParams.set("code", code);
  return res.redirect(302, redirect.toString());
}

async function handleSsoConsume(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const code = String(req.body?.code || "").trim();
  if (!code) return res.status(400).json({ error: "Missing code" });

  await dbConnect();
  const record = await WorkOSSsoCode.findOneAndDelete({
    code,
    expiresAt: { $gt: new Date() },
  });
  if (!record) return res.status(401).json({ error: "Invalid or expired SSO code" });

  const payload = {
    id: record.userId.toString(),
    name: record.name,
    email: record.email,
  };

  if (code.startsWith("robolab.")) {
    payload.appPassword = robolabPassword(record.userId);
    payload.robolabToken = signRoboLabSession({
      id: record.userId.toString(),
      name: record.name || "",
      email: record.email,
    });
    payload.expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  }

  return res.status(200).json(payload);
}

async function handleGoogle(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!client) return res.status(500).json({ error: "Google Sign-In is not configured. Add GOOGLE_CLIENT_ID in Vercel." });

  const idToken = String(req.body?.idToken || "");
  if (!idToken) return res.status(400).json({ error: "Missing Google credential." });

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(401).json({ error: "Google account has no email." });

    const email = payload.email.toLowerCase().trim();
    const name = String(payload.name || email.split("@")[0]).trim().slice(0, 120);
    const avatar = String(payload.picture || "").trim().slice(0, 1000);

    await dbConnect();
    let user = await WorkOSUser.findOne({ email });
    let created = false;

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      user = await WorkOSUser.create({
        name,
        email,
        avatar,
        password: await bcrypt.hash(randomPassword, 10),
      });
      created = true;
    } else {
      let changed = false;
      if (!user.name && name) { user.name = name; changed = true; }
      if (avatar && user.avatar !== avatar) { user.avatar = avatar; changed = true; }
      if (changed) await user.save();
    }

    const token = signWorkOSSession({ id: user._id.toString(), name: user.name, email: user.email });
    setWorkOSCookie(res, token);
    await recordAnalytics(created ? "brain_signup" : "brain_login", {
      req,
      brainUser: user._id,
      path: "/login",
      source: "Google / Ashes Account",
    });

    return res.status(200).json({ id: user._id, name: user.name, email: user.email, avatar: user.avatar || "", account: "workos", created });
  } catch (error) {
    return res.status(401).json({ error: "Could not verify Google account." });
  }
}

export default async function handler(req, res) {
  const sso = String(req.query?.sso || "");
  const robolab = String(req.query?.robolab || "");
  try {
    if (robolab === "projects") return await handleRoboLabProjects(req, res);
    if (sso === "issue") return await handleSsoIssue(req, res);
    if (sso === "consume") return await handleSsoConsume(req, res);
    return await handleGoogle(req, res);
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Authentication failed" });
  }
}

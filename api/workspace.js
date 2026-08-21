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
import { deviceFromRequest, recordAnalytics } from "../lib/analytics.js";
import AnalyticsEvent from "../models/AnalyticsEvent.js";
import WorkOSProject from "../models/WorkOSProject.js";
import WorkOSUser from "../models/WorkOSUser.js";

const PUBLIC_ANALYTICS_EVENTS = new Set(["page_view", "link_click"]);

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

function safeAnalyticsPath(path = "") {
  const value = String(path || "").trim().slice(0, 500);
  return value.startsWith("/workspace/share/") ? "/workspace/share/:token" : value;
}

async function aggregateRanking(match, field, limit = 8) {
  const rows = await AnalyticsEvent.aggregate([
    { $match: match },
    { $match: { [field]: { $nin: ["", null] } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  return rows.map((row) => ({ label: String(row._id || "Unknown"), count: row.count }));
}

async function handlePublicAnalytics(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const event = String(req.body?.event || "").trim();
  if (!PUBLIC_ANALYTICS_EVENTS.has(event)) return res.status(400).json({ error: "Unknown analytics event" });
  if (deviceFromRequest(req) === "bot") return res.status(202).json({ ok: true, ignored: "bot" });

  await recordAnalytics(event, {
    req,
    path: safeAnalyticsPath(req.body?.path),
    sessionId: String(req.body?.sessionId || "").slice(0, 120),
    source: String(req.body?.source || "direct").slice(0, 160),
    referrer: String(req.body?.referrer || "").slice(0, 500),
    meta: req.body?.meta || {},
  });
  return res.status(202).json({ ok: true });
}

async function handleAdminAnalytics(req, res) {
  const admin = getUserFromReq(req);
  if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Admin only" });
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  await dbConnect();
  const days = Math.min(365, Math.max(1, Number(req.query?.days) || 30));
  const since = new Date(Date.now() - days * 86400000);
  const base = { createdAt: { $gte: since } };
  const pageMatch = { ...base, event: "page_view" };

  const [
    pageViews,
    linkClicks,
    brainSignups,
    brainLogins,
    aiConnections,
    mcpCalls,
    shareViews,
    shareCreated,
    totalBrainUsers,
    sharedBrains,
    sessionIds,
    connectedIds,
    activeIds,
    firstTracked,
    topPages,
    topSources,
    topCountries,
    topDevices,
    topLinks,
    topTools,
    topAiClients,
    dailyEvents,
    dailySignups,
    recentEvents,
  ] = await Promise.all([
    AnalyticsEvent.countDocuments(pageMatch),
    AnalyticsEvent.countDocuments({ ...base, event: "link_click" }),
    WorkOSUser.countDocuments({ createdAt: { $gte: since } }),
    AnalyticsEvent.countDocuments({ ...base, event: "brain_login" }),
    AnalyticsEvent.countDocuments({ ...base, event: "ai_connection_approved" }),
    AnalyticsEvent.countDocuments({ ...base, event: "mcp_tool_call" }),
    AnalyticsEvent.countDocuments({ ...base, event: "share_view" }),
    AnalyticsEvent.countDocuments({ ...base, event: "share_created" }),
    WorkOSUser.countDocuments({}),
    WorkOSProject.countDocuments({ shareEnabled: true }),
    AnalyticsEvent.distinct("sessionId", { ...pageMatch, sessionId: { $nin: ["", null] } }),
    AnalyticsEvent.distinct("brainUser", { ...base, event: "ai_connection_approved", brainUser: { $ne: null } }),
    AnalyticsEvent.distinct("brainUser", { ...base, event: { $in: ["brain_login", "ai_connection_approved", "mcp_tool_call", "share_created"] }, brainUser: { $ne: null } }),
    AnalyticsEvent.findOne({}).sort({ createdAt: 1 }).select("createdAt").lean(),
    aggregateRanking(pageMatch, "path", 10),
    aggregateRanking(pageMatch, "source", 10),
    aggregateRanking(pageMatch, "country", 10),
    aggregateRanking({ ...pageMatch, device: { $ne: "bot" } }, "device", 10),
    aggregateRanking({ ...base, event: "link_click" }, "meta.destination", 10),
    aggregateRanking({ ...base, event: "mcp_tool_call" }, "meta.tool", 10),
    aggregateRanking({ ...base, event: "ai_connection_approved" }, "source", 10),
    AnalyticsEvent.aggregate([
      { $match: { ...base, event: { $in: ["page_view", "mcp_tool_call", "share_view"] } } },
      { $group: { _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, event: "$event" }, count: { $sum: 1 } } },
      { $sort: { "_id.day": 1 } },
    ]),
    WorkOSUser.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    AnalyticsEvent.find(base).sort({ createdAt: -1 }).limit(30).select("event path source country device meta createdAt").lean(),
  ]);

  const eventMap = new Map();
  for (const row of dailyEvents) {
    const current = eventMap.get(row._id.day) || { page_view: 0, mcp_tool_call: 0, share_view: 0 };
    current[row._id.event] = row.count;
    eventMap.set(row._id.day, current);
  }
  const signupMap = new Map(dailySignups.map((row) => [row._id, row.count]));
  const daily = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(Date.now() - offset * 86400000);
    const key = date.toISOString().slice(0, 10);
    const row = eventMap.get(key) || {};
    daily.push({
      date: key,
      label: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      pageViews: row.page_view || 0,
      mcpCalls: row.mcp_tool_call || 0,
      shareViews: row.share_view || 0,
      signups: signupMap.get(key) || 0,
    });
  }

  const visits = sessionIds.filter(Boolean).length;
  const signupConversionRate = visits ? Math.round((brainSignups / visits) * 1000) / 10 : null;

  return res.status(200).json({
    rangeDays: days,
    trackingStartedAt: firstTracked?.createdAt || null,
    summary: {
      visits,
      pageViews,
      linkClicks,
      brainSignups,
      brainLogins,
      aiConnections,
      connectedBrainUsers: connectedIds.filter(Boolean).length,
      mcpCalls,
      shareViews,
      shareCreated,
      totalBrainUsers,
      activeBrainUsers: activeIds.filter(Boolean).length,
      sharedBrains,
      signupConversionRate,
    },
    daily,
    topPages,
    topSources,
    topCountries,
    topDevices,
    topLinks,
    topTools,
    topAiClients,
    recentEvents,
    monetization: {
      adsenseConfigured: Boolean(process.env.ADSENSE_CLIENT_ID || process.env.VITE_ADSENSE_CLIENT_ID),
    },
  });
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
    await recordAnalytics("brain_signup", { req, brainUser: user._id, path: "/workspace/login", source: "Ashes Brain" });
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
    await recordAnalytics("brain_login", { req, brainUser: user._id, path: "/workspace/login", source: "Ashes Brain" });
    return res.status(200).json({ id: user._id, name: user.name, email: user.email, account: "workos", migratedProjects });
  }

  return res.status(404).json({ error: "Unknown Brain auth action" });
}

export default async function handler(req, res) {
  const analyticsAction = String(req.query?.analytics || "");
  if (analyticsAction === "track") return handlePublicAnalytics(req, res);
  if (analyticsAction === "admin") return handleAdminAnalytics(req, res);

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
      await recordAnalytics("share_view", { req, path: "/workspace/share/:token", source: "shared Brain", meta: { projectId: project.clientId } });
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
      await recordAnalytics("share_created", { req, brainUser: authUser.id, path: "/workspace", source: "Ashes Brain", meta: { projectId: project.clientId } });
      return res.status(200).json({
        ok: true,
        shareUrl: `https://www.ashesstack.cloud/workspace/share/${project.shareToken}`,
      });
    }

    if (action === "unshare") {
      const id = String(req.body.id || "").trim();
      if (!id) return res.status(400).json({ error: "Missing project id" });
      await WorkOSProject.updateOne({ owner: authUser.id, clientId: id }, { $set: { shareEnabled: false } });
      await recordAnalytics("share_disabled", { req, brainUser: authUser.id, path: "/workspace", source: "Ashes Brain", meta: { projectId: id } });
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

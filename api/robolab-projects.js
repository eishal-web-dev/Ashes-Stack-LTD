import mongoose from "mongoose";
import { dbConnect } from "../lib/mongodb.js";
import { verifyRoboLabSession } from "../lib/workspaceAuth.js";
import RoboLabProject from "../models/RoboLabProject.js";

const ALLOWED_ORIGIN = "https://robotsimulation.vercel.app";

function setCors(req, res) {
  const origin = String(req.headers.origin || "");
  if (!origin || origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
}

function getBearer(req) {
  const auth = String(req.headers.authorization || "");
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
}

function row(doc) {
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

function normalizeSnapshot(value) {
  const snap = value && typeof value === "object" ? value : {};
  const nodes = Array.isArray(snap.nodes) ? snap.nodes : [];
  const edges = Array.isArray(snap.edges) ? snap.edges : [];
  return {
    title: String(snap.title || "Untitled Project").slice(0, 180),
    description: String(snap.description || "").slice(0, 4000),
    tags: Array.isArray(snap.tags) ? snap.tags.map((x) => String(x).slice(0, 60)).slice(0, 30) : [],
    circuitData: { nodes, edges },
    codeData: String(snap.code || "").slice(0, 250000),
    worldData: snap.world && typeof snap.world === "object" ? snap.world : {},
  };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const origin = String(req.headers.origin || "");
  if (origin && origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  const session = verifyRoboLabSession(getBearer(req));
  if (!session?.id) return res.status(401).json({ error: "RoboLab session expired. Sign in with Ashes again." });

  try {
    await dbConnect();
    const userId = String(session.id);

    if (req.method === "GET") {
      const id = String(req.query?.id || "").trim();
      if (id) {
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid project id" });
        const doc = await RoboLabProject.findOne({ _id: id, userId });
        return res.status(200).json({ project: doc ? row(doc) : null });
      }
      const docs = await RoboLabProject.find({ userId }).sort({ updatedAt: -1 }).limit(250);
      return res.status(200).json({ projects: docs.map(row) });
    }

    if (req.method === "POST") {
      const snapshot = normalizeSnapshot(req.body?.snapshot);
      const doc = await RoboLabProject.create({ userId, ...snapshot });
      return res.status(201).json({ project: row(doc) });
    }

    if (req.method === "PATCH") {
      const id = String(req.body?.id || "").trim();
      if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid project id" });
      const update = {};
      if (req.body?.snapshot) Object.assign(update, normalizeSnapshot(req.body.snapshot));
      if (typeof req.body?.is_public === "boolean") update.isPublic = req.body.is_public;
      const doc = await RoboLabProject.findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true });
      if (!doc) return res.status(404).json({ error: "Project not found" });
      return res.status(200).json({ project: row(doc) });
    }

    if (req.method === "DELETE") {
      const id = String(req.body?.id || "").trim();
      if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid project id" });
      const deleted = await RoboLabProject.findOneAndDelete({ _id: id, userId });
      if (!deleted) return res.status(404).json({ error: "Project not found" });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("RoboLab project API error", error);
    return res.status(500).json({ error: error?.message || "RoboLab project request failed" });
  }
}

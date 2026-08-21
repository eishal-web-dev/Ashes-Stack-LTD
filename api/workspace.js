import { dbConnect } from "../lib/mongodb.js";
import { getUserFromReq } from "../lib/auth.js";
import WorkOSProject from "../models/WorkOSProject.js";

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

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
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

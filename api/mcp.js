import crypto from "node:crypto";
import { dbConnect } from "../lib/mongodb.js";
import { bearerFromRequest, mcpResource, verifyMcpAccessToken } from "../lib/mcpAuth.js";
import WorkOSProject from "../models/WorkOSProject.js";

const SERVER_INFO = { name: "ashes-work-os", title: "Ashes Shared Brain", version: "0.1.0" };
const AUTH_METADATA = "https://www.ashesstack.cloud/.well-known/oauth-protected-resource";

const TOOLS = [
  {
    name: "list_projects",
    title: "List Ashes projects",
    description: "Use this when you need to see the user's Ashes Work OS projects before reading or updating project context.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "get_project_context",
    title: "Get shared project context",
    description: "Use this when you need the shared Ashes brain for a project: its goal, decisions, memories, conversations, and handoffs.",
    inputSchema: {
      type: "object",
      properties: { project_id: { type: "string", description: "Ashes project id. Omit to use the most recently updated project." } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "search",
    title: "Search Ashes memory",
    description: "Use this when you need to find relevant facts, decisions, conversations, or handoffs in the user's Ashes project memory.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 1, description: "What to search for." },
        project_id: { type: "string", description: "Optional Ashes project id." },
      },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "fetch",
    title: "Fetch Ashes memory item",
    description: "Use this when you have an Ashes result id from search and need the complete project or memory item.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", minLength: 1, description: "A project:<id> or memory:<project-id>:<memory-id> result id." } },
      required: ["id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "remember",
    title: "Remember in Ashes",
    description: "Use this when the user makes an important project decision or gives durable project context that other AI clients should know.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Ashes project id. Omit to use the most recently updated project." },
        text: { type: "string", minLength: 1, maxLength: 12000 },
        kind: { type: "string", enum: ["memory", "decision", "conversation"], default: "memory" },
        source: { type: "string", maxLength: 80, description: "AI/client name, e.g. ChatGPT or Claude." },
      },
      required: ["text"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: "handoff",
    title: "Save AI handoff",
    description: "Use this when one AI has completed work and needs to leave the next AI a concise state, result, or next-step handoff in the shared Ashes brain.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Ashes project id. Omit to use the most recently updated project." },
        text: { type: "string", minLength: 1, maxLength: 12000 },
        source: { type: "string", maxLength: 80, description: "AI/client creating the handoff." },
      },
      required: ["text"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
];

function textResult(text, structuredContent) {
  return { content: [{ type: "text", text }], ...(structuredContent ? { structuredContent } : {}) };
}

function toolError(message) {
  return { content: [{ type: "text", text: message }], isError: true };
}

function memoryToClient(item) {
  return {
    id: item.clientId,
    text: item.text,
    source: item.source,
    kind: item.kind || "memory",
    createdAt: new Date(item.createdAt).toISOString(),
  };
}

function projectToClient(project, memoryLimit = 40) {
  const memory = (project.memory || []).slice(0, memoryLimit).map(memoryToClient);
  return {
    id: project.clientId,
    name: project.name,
    goal: project.goal || "",
    memory,
    updatedAt: new Date(project.updatedAt).toISOString(),
  };
}

async function selectProject(owner, projectId) {
  if (projectId) return WorkOSProject.findOne({ owner, clientId: String(projectId) });
  return WorkOSProject.findOne({ owner }).sort({ updatedAt: -1 });
}

function contextText(project) {
  const memories = (project.memory || []).slice(0, 40).reverse().map((item) =>
    `[${item.kind || "memory"} · ${item.source || "Ashes"}] ${item.text}`
  ).join("\n\n");
  return [
    "ASHES SHARED PROJECT BRAIN",
    `Project: ${project.name}`,
    `Project ID: ${project.clientId}`,
    `Goal: ${project.goal || "No goal set."}`,
    "",
    "Use this as shared project context across AI clients. Preserve existing decisions unless the user changes them.",
    "",
    memories || "No shared memory yet.",
  ].join("\n");
}

async function runTool(owner, name, args = {}) {
  if (name === "list_projects") {
    const projects = await WorkOSProject.find({ owner }).sort({ updatedAt: -1 }).limit(50);
    const data = projects.map((project) => ({ id: project.clientId, name: project.name, goal: project.goal || "", updatedAt: project.updatedAt }));
    return textResult(data.length ? data.map((p) => `${p.name} (${p.id}) — ${p.goal || "no goal"}`).join("\n") : "No Ashes projects yet.", { projects: data });
  }

  if (name === "get_project_context") {
    const project = await selectProject(owner, args.project_id);
    if (!project) return toolError("Ashes project not found. Create a project in Work OS first.");
    return textResult(contextText(project), { project: projectToClient(project) });
  }

  if (name === "search") {
    const query = String(args.query || "").trim().toLowerCase();
    if (!query) return toolError("Search query is required.");
    const projects = args.project_id
      ? await WorkOSProject.find({ owner, clientId: String(args.project_id) })
      : await WorkOSProject.find({ owner }).sort({ updatedAt: -1 }).limit(25);
    const results = [];
    for (const project of projects) {
      const projectHaystack = `${project.name} ${project.goal || ""}`.toLowerCase();
      if (projectHaystack.includes(query)) {
        results.push({ id: `project:${project.clientId}`, title: project.name, text: project.goal || "Project context", project_id: project.clientId });
      }
      for (const item of project.memory || []) {
        if (!String(item.text || "").toLowerCase().includes(query)) continue;
        results.push({
          id: `memory:${project.clientId}:${item.clientId}`,
          title: `${project.name} · ${item.kind || "memory"}`,
          text: String(item.text).slice(0, 1200),
          project_id: project.clientId,
          source: item.source,
        });
        if (results.length >= 20) break;
      }
      if (results.length >= 20) break;
    }
    return textResult(results.length ? results.map((r) => `${r.id}\n${r.title}\n${r.text}`).join("\n\n") : "No matching Ashes memory found.", { results });
  }

  if (name === "fetch") {
    const id = String(args.id || "");
    if (id.startsWith("project:")) {
      const project = await selectProject(owner, id.slice("project:".length));
      if (!project) return toolError("Project not found.");
      return textResult(contextText(project), { project: projectToClient(project) });
    }
    if (id.startsWith("memory:")) {
      const payload = id.slice("memory:".length);
      const splitAt = payload.indexOf(":");
      if (splitAt < 1) return toolError("Invalid memory id.");
      const projectId = payload.slice(0, splitAt);
      const memoryId = payload.slice(splitAt + 1);
      const project = await selectProject(owner, projectId);
      const item = project?.memory?.find((memory) => memory.clientId === memoryId);
      if (!project || !item) return toolError("Memory item not found.");
      const data = { project: { id: project.clientId, name: project.name }, memory: memoryToClient(item) };
      return textResult(`[${item.kind || "memory"} · ${item.source || "Ashes"}] ${item.text}`, data);
    }
    return toolError("Unknown Ashes result id.");
  }

  if (name === "remember" || name === "handoff") {
    const text = String(args.text || "").trim().slice(0, 12000);
    if (!text) return toolError("Memory text is required.");
    const project = await selectProject(owner, args.project_id);
    if (!project) return toolError("Ashes project not found. Create a project in Work OS first.");
    const kind = name === "handoff" ? "handoff" : ["memory", "decision", "conversation"].includes(args.kind) ? args.kind : "memory";
    const item = {
      clientId: `mcp-${crypto.randomUUID()}`,
      text,
      source: String(args.source || "AI client").trim().slice(0, 80) || "AI client",
      kind,
      createdAt: new Date(),
    };
    project.memory.unshift(item);
    if (project.memory.length > 250) project.memory = project.memory.slice(0, 250);
    await project.save();
    return textResult(`Saved to Ashes shared brain for ${project.name}.`, { project_id: project.clientId, memory: memoryToClient(item) });
  }

  return toolError(`Unknown Ashes tool: ${name}`);
}

async function handleRpc(owner, message) {
  const id = message?.id;
  const method = message?.method;
  if (!method) return id === undefined ? null : { jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid Request" } };

  if (method === "initialize") {
    const requested = message?.params?.protocolVersion;
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: requested || "2025-06-18",
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: "Ashes is a shared project brain. Read project context before continuing work, save durable decisions with remember, and leave cross-AI state with handoff.",
      },
    };
  }

  if (method === "notifications/initialized" || method === "notifications/cancelled") return null;
  if (method === "ping") return { jsonrpc: "2.0", id, result: {} };
  if (method === "tools/list") return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
  if (method === "tools/call") {
    try {
      const result = await runTool(owner, message?.params?.name, message?.params?.arguments || {});
      return { jsonrpc: "2.0", id, result };
    } catch (error) {
      return { jsonrpc: "2.0", id, result: toolError(error?.message || "Ashes tool failed") };
    }
  }
  return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id");
  res.setHeader("Access-Control-Expose-Headers", "WWW-Authenticate, MCP-Protocol-Version");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("MCP-Protocol-Version", String(req.headers["mcp-protocol-version"] || "2025-06-18"));

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET") return res.status(405).json({ name: SERVER_INFO.name, status: "online", endpoint: mcpResource, method: "POST" });
  if (req.method !== "POST") return res.status(405).end();

  const access = verifyMcpAccessToken(bearerFromRequest(req));
  if (!access?.sub) {
    res.setHeader("WWW-Authenticate", `Bearer resource_metadata=\"${AUTH_METADATA}\"`);
    return res.status(401).json({ error: "unauthorized", error_description: "Connect your Ashes account to access this shared brain." });
  }

  try {
    await dbConnect();
    const body = req.body;
    if (Array.isArray(body)) {
      const replies = (await Promise.all(body.map((message) => handleRpc(access.sub, message)))).filter(Boolean);
      if (!replies.length) return res.status(202).end();
      return res.status(200).json(replies);
    }
    const reply = await handleRpc(access.sub, body);
    if (!reply) return res.status(202).end();
    return res.status(200).json(reply);
  } catch (error) {
    return res.status(500).json({ jsonrpc: "2.0", id: req.body?.id ?? null, error: { code: -32603, message: error?.message || "Ashes MCP failed" } });
  }
}

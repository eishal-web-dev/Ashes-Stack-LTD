import mongoose from "mongoose";
import { dbConnect } from "./mongodb.js";
import { signToken } from "./auth.js";
import { pkceChallenge } from "./mcpAuth.js";
import oauthHandler from "./mcpOAuth.js";
import mcpHandler from "./mcpRpc.js";
import WorkOSProject from "../models/WorkOSProject.js";

function fakeResponse() {
  const state = { statusCode: 200, headers: {}, body: null, redirected: null, ended: false };
  const res = {
    setHeader(name, value) { state.headers[String(name).toLowerCase()] = value; return res; },
    status(code) { state.statusCode = code; return res; },
    json(value) { state.body = value; return res; },
    send(value) { state.body = value; return res; },
    end(value) { state.body = value ?? state.body; state.ended = true; return res; },
    redirect(code, url) {
      if (typeof code === "string") { url = code; code = 302; }
      state.statusCode = code || 302;
      state.redirected = url;
      return res;
    },
  };
  return { res, state };
}

async function callOauth({ method, query, body, headers = {} }) {
  const { res, state } = fakeResponse();
  await oauthHandler({ method, query, body, headers }, res);
  return state;
}

async function callMcp(body, token = "") {
  const { res, state } = fakeResponse();
  const headers = { "mcp-protocol-version": "2025-06-18" };
  if (token) headers.authorization = `Bearer ${token}`;
  await mcpHandler({ method: "POST", query: {}, body, headers }, res);
  return state;
}

function resultText(state) {
  return state?.body?.result?.content?.map((item) => item?.text || "").join("\n") || "";
}

function pass(checks, name, condition, detail = "") {
  checks[name] = { ok: Boolean(condition), ...(detail ? { detail } : {}) };
  if (!condition) throw new Error(`Self-test failed: ${name}${detail ? ` — ${detail}` : ""}`);
}

export default async function runMcpSelfTest() {
  const startedAt = Date.now();
  const checks = {};
  const owner = new mongoose.Types.ObjectId();
  const projectId = `selftest-${Date.now()}`;
  const redirectUri = "https://client.example.invalid/oauth/callback";
  const verifier = `ashes-selftest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const challenge = pkceChallenge(verifier);

  try {
    await dbConnect();
    pass(checks, "database_connect", true);

    await WorkOSProject.create({
      owner,
      clientId: projectId,
      name: "Ashes MCP Self Test",
      goal: "Verify OAuth, JSON-RPC, reads, writes, search, fetch and handoff.",
      memory: [{
        clientId: "seed-memory",
        text: "seed phrase for ashes mcp self test",
        source: "SelfTest",
        kind: "memory",
        createdAt: new Date(),
      }],
    });
    pass(checks, "temporary_project_create", true);

    const registration = await callOauth({
      method: "POST",
      query: { action: "register" },
      body: { client_name: "Ashes MCP Self Test Client", redirect_uris: [redirectUri] },
    });
    const clientId = registration.body?.client_id;
    pass(checks, "oauth_dynamic_registration", registration.statusCode === 201 && Boolean(clientId), `status ${registration.statusCode}`);

    const authQuery = {
      action: "authorize",
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state: "ashes-selftest-state",
      scope: "ashes:brain",
      code_challenge: challenge,
      code_challenge_method: "S256",
    };

    const unauthAuthorize = await callOauth({ method: "GET", query: authQuery, headers: {} });
    pass(
      checks,
      "oauth_login_redirect",
      unauthAuthorize.statusCode === 302 && String(unauthAuthorize.redirected || "").startsWith("/login?next="),
      `status ${unauthAuthorize.statusCode}`,
    );

    const sessionToken = signToken({ id: owner.toString(), role: "client" });
    const approved = await callOauth({
      method: "GET",
      query: { ...authQuery, consent: "approve" },
      headers: { cookie: `ashes_token=${sessionToken}` },
    });
    const approvedUrl = new URL(approved.redirected);
    const code = approvedUrl.searchParams.get("code");
    pass(
      checks,
      "oauth_consent_code",
      approved.statusCode === 302 && Boolean(code) && approvedUrl.searchParams.get("state") === "ashes-selftest-state",
      `status ${approved.statusCode}`,
    );

    const tokenExchange = await callOauth({
      method: "POST",
      query: { action: "token" },
      body: {
        grant_type: "authorization_code",
        client_id: clientId,
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      },
    });
    const accessToken = tokenExchange.body?.access_token;
    const refreshToken = tokenExchange.body?.refresh_token;
    pass(
      checks,
      "oauth_pkce_token_exchange",
      tokenExchange.statusCode === 200 && Boolean(accessToken) && Boolean(refreshToken),
      `status ${tokenExchange.statusCode}`,
    );

    const refreshed = await callOauth({
      method: "POST",
      query: { action: "token" },
      body: { grant_type: "refresh_token", client_id: clientId, refresh_token: refreshToken },
    });
    pass(checks, "oauth_refresh_token", refreshed.statusCode === 200 && Boolean(refreshed.body?.access_token), `status ${refreshed.statusCode}`);

    const unauthorized = await callMcp({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
    pass(
      checks,
      "mcp_oauth_challenge",
      unauthorized.statusCode === 401 && String(unauthorized.headers["www-authenticate"] || "").includes("oauth-protected-resource"),
      `status ${unauthorized.statusCode}`,
    );

    const initialized = await callMcp({ jsonrpc: "2.0", id: 2, method: "initialize", params: { protocolVersion: "2025-06-18" } }, accessToken);
    pass(
      checks,
      "mcp_initialize",
      initialized.statusCode === 200 && initialized.body?.result?.serverInfo?.name === "ashes-work-os",
      `status ${initialized.statusCode}`,
    );

    const tools = await callMcp({ jsonrpc: "2.0", id: 3, method: "tools/list", params: {} }, accessToken);
    const toolNames = tools.body?.result?.tools?.map((tool) => tool.name) || [];
    const requiredTools = ["list_projects", "get_project_context", "search", "fetch", "remember", "handoff"];
    pass(checks, "mcp_tools_manifest", requiredTools.every((name) => toolNames.includes(name)), toolNames.join(", "));

    const listed = await callMcp({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "list_projects", arguments: {} } }, accessToken);
    pass(checks, "tool_list_projects", listed.statusCode === 200 && resultText(listed).includes(projectId));

    const context = await callMcp({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "get_project_context", arguments: { project_id: projectId } } }, accessToken);
    pass(checks, "tool_get_project_context", resultText(context).includes("seed phrase for ashes mcp self test"));

    const searched = await callMcp({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "search", arguments: { project_id: projectId, query: "seed phrase" } } }, accessToken);
    pass(checks, "tool_search", resultText(searched).includes("seed phrase for ashes mcp self test"));

    const fetched = await callMcp({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "fetch", arguments: { id: `memory:${projectId}:seed-memory` } } }, accessToken);
    pass(checks, "tool_fetch", resultText(fetched).includes("seed phrase for ashes mcp self test"));

    const remembered = await callMcp({
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: { name: "remember", arguments: { project_id: projectId, text: "remember probe 8417", kind: "decision", source: "SelfTest" } },
    }, accessToken);
    pass(checks, "tool_remember", remembered.statusCode === 200 && !remembered.body?.result?.isError);

    const handedOff = await callMcp({
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: { name: "handoff", arguments: { project_id: projectId, text: "handoff probe 2468", source: "SelfTest" } },
    }, accessToken);
    pass(checks, "tool_handoff", handedOff.statusCode === 200 && !handedOff.body?.result?.isError);

    const afterWrite = await callMcp({ jsonrpc: "2.0", id: 10, method: "tools/call", params: { name: "get_project_context", arguments: { project_id: projectId } } }, accessToken);
    const afterText = resultText(afterWrite);
    pass(checks, "writes_persisted", afterText.includes("remember probe 8417") && afterText.includes("handoff probe 2468"));

    return {
      ok: true,
      checks,
      duration_ms: Date.now() - startedAt,
      note: "Temporary self-test project was isolated from user projects and is deleted in cleanup.",
    };
  } catch (error) {
    return {
      ok: false,
      checks,
      error: error?.message || "MCP self-test failed",
      duration_ms: Date.now() - startedAt,
    };
  } finally {
    try { await WorkOSProject.deleteMany({ owner }); } catch {}
  }
}

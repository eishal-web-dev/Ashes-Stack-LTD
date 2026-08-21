import { getUserFromReq } from "../../lib/auth.js";
import {
  oauthIssuer,
  pkceChallenge,
  signAuthorizationCode,
  signMcpAccessToken,
  signMcpRefreshToken,
  signOAuthClient,
  verifyAuthorizationCode,
  verifyMcpRefreshToken,
  verifyOAuthClient,
} from "../../lib/mcpAuth.js";

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function bodyParams(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") return Object.fromEntries(new URLSearchParams(req.body));
  return req.body;
}

function safeRedirect(uri) {
  try {
    const url = new URL(uri);
    return ["https:", "http:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

function redirectWith(res, uri, values) {
  const url = safeRedirect(uri);
  if (!url) return res.status(400).send("Invalid redirect URI");
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  res.redirect(302, url.toString());
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;",
  })[char]);
}

function authRequestPath(query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query || {})) {
    const v = first(value);
    if (v !== undefined && v !== null) params.set(key, String(v));
  }
  params.delete("action");
  params.delete("consent");
  return `/oauth/authorize?${params.toString()}`;
}

async function register(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const body = bodyParams(req);
  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris.map(String) : [];
  if (!redirectUris.length || redirectUris.some((uri) => !safeRedirect(uri))) {
    return res.status(400).json({ error: "invalid_redirect_uris" });
  }
  const clientName = String(body.client_name || "Ashes MCP client").slice(0, 120);
  const clientId = signOAuthClient({ name: clientName, redirectUris });
  return res.status(201).json({
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: clientName,
    redirect_uris: redirectUris,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
  });
}

async function authorize(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method not allowed");
  const responseType = String(first(req.query.response_type) || "");
  const clientId = String(first(req.query.client_id) || "");
  const redirectUri = String(first(req.query.redirect_uri) || "");
  const state = String(first(req.query.state) || "");
  const scope = String(first(req.query.scope) || "ashes:brain");
  const codeChallenge = String(first(req.query.code_challenge) || "");
  const challengeMethod = String(first(req.query.code_challenge_method) || "S256");
  const consent = String(first(req.query.consent) || "");

  if (responseType !== "code") return res.status(400).send("Ashes only supports OAuth authorization_code.");
  const client = verifyOAuthClient(clientId);
  if (!client) return res.status(400).send("Unknown OAuth client.");
  if (!client.redirectUris?.includes(redirectUri)) return res.status(400).send("Redirect URI is not registered.");
  if (!codeChallenge || challengeMethod !== "S256") return res.status(400).send("PKCE S256 is required.");

  const user = getUserFromReq(req);
  if (!user) {
    const next = authRequestPath(req.query);
    return res.redirect(302, `/login?next=${encodeURIComponent(next)}`);
  }

  if (consent === "deny") return redirectWith(res, redirectUri, { error: "access_denied", state });
  if (consent === "approve") {
    const code = signAuthorizationCode({ userId: user.id, clientId, redirectUri, codeChallenge, scope });
    return redirectWith(res, redirectUri, { code, state });
  }

  const base = authRequestPath(req.query);
  const approve = `${base}&consent=approve`;
  const deny = `${base}&consent=deny`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connect Ashes</title><style>body{margin:0;background:#090909;color:#f3f3ef;font-family:Inter,system-ui,sans-serif;display:grid;place-items:center;min-height:100vh}.box{width:min(420px,calc(100vw - 36px));border:1px solid #252525;border-radius:18px;padding:28px;background:#0e0e0e}h1{font-size:24px;margin:8px 0}p{color:#8b8b86;font-size:13px;line-height:1.6}.tag{font-size:10px;letter-spacing:.15em;color:#686868}.actions{display:flex;gap:10px;margin-top:22px}.btn{flex:1;text-align:center;padding:11px 12px;border-radius:10px;text-decoration:none;font-size:12px;font-weight:800}.yes{background:#f2f2ee;color:#0a0a0a}.no{border:1px solid #2a2a2a;color:#aaa}.scope{margin:18px 0 0;padding:12px;border:1px solid #202020;border-radius:10px;color:#aaa;font-size:12px}</style></head><body><main class="box"><div class="tag">ASHES WORK OS</div><h1>Connect ${escapeHtml(client.name || "AI client")}?</h1><p>This client will be able to read your Ashes project context and, where the client supports write tools, save memories and handoffs back to your shared brain.</p><div class="scope">Permission: ${escapeHtml(scope)}</div><div class="actions"><a class="btn no" href="${escapeHtml(deny)}">Cancel</a><a class="btn yes" href="${escapeHtml(approve)}">Allow Ashes</a></div></main></body></html>`);
}

async function token(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const body = bodyParams(req);
  const grantType = String(body.grant_type || "");
  const clientId = String(body.client_id || "");
  const client = verifyOAuthClient(clientId);
  if (!client) return res.status(400).json({ error: "invalid_client" });

  if (grantType === "authorization_code") {
    const grant = verifyAuthorizationCode(body.code);
    if (!grant || grant.clientId !== clientId || grant.redirectUri !== String(body.redirect_uri || "")) {
      return res.status(400).json({ error: "invalid_grant" });
    }
    const verifier = String(body.code_verifier || "");
    if (!verifier || pkceChallenge(verifier) !== grant.codeChallenge) {
      return res.status(400).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
    }
    return res.status(200).json({
      access_token: signMcpAccessToken({ userId: grant.sub, clientId, scope: grant.scope }),
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: signMcpRefreshToken({ userId: grant.sub, clientId, scope: grant.scope }),
      scope: grant.scope || "ashes:brain",
    });
  }

  if (grantType === "refresh_token") {
    const refresh = verifyMcpRefreshToken(body.refresh_token);
    if (!refresh || refresh.clientId !== clientId) return res.status(400).json({ error: "invalid_grant" });
    return res.status(200).json({
      access_token: signMcpAccessToken({ userId: refresh.sub, clientId, scope: refresh.scope }),
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: signMcpRefreshToken({ userId: refresh.sub, clientId, scope: refresh.scope }),
      scope: refresh.scope || "ashes:brain",
    });
  }

  return res.status(400).json({ error: "unsupported_grant_type" });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const action = String(first(req.query.action) || "");
  if (action === "register") return register(req, res);
  if (action === "authorize") return authorize(req, res);
  if (action === "token") return token(req, res);
  return res.status(404).json({ error: "not_found", issuer: oauthIssuer });
}

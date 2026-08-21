import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const ISSUER = "https://www.ashesstack.cloud";
const RESOURCE = `${ISSUER}/mcp`;

function sign(payload, expiresIn) {
  return jwt.sign(payload, JWT_SECRET, { issuer: ISSUER, expiresIn });
}

export function signOAuthClient({ name = "Ashes MCP client", redirectUris = [] } = {}) {
  return sign({
    typ: "mcp_client",
    name: String(name).slice(0, 120),
    redirectUris: redirectUris.map(String).slice(0, 12),
  }, "365d");
}

export function verifyOAuthClient(clientId) {
  try {
    const payload = jwt.verify(String(clientId || ""), JWT_SECRET, { issuer: ISSUER });
    return payload?.typ === "mcp_client" ? payload : null;
  } catch {
    return null;
  }
}

export function signAuthorizationCode({ userId, clientId, redirectUri, codeChallenge, scope = "ashes:brain" }) {
  return sign({
    typ: "mcp_code",
    sub: String(userId),
    clientId: String(clientId),
    redirectUri: String(redirectUri),
    codeChallenge: String(codeChallenge || ""),
    scope: String(scope || "ashes:brain"),
    jti: crypto.randomUUID(),
  }, "5m");
}

export function verifyAuthorizationCode(code) {
  try {
    const payload = jwt.verify(String(code || ""), JWT_SECRET, { issuer: ISSUER });
    return payload?.typ === "mcp_code" ? payload : null;
  } catch {
    return null;
  }
}

export function signMcpAccessToken({ userId, clientId, scope = "ashes:brain" }) {
  return sign({
    typ: "mcp_access",
    sub: String(userId),
    clientId: String(clientId || ""),
    scope: String(scope || "ashes:brain"),
    aud: RESOURCE,
  }, "1h");
}

export function signMcpRefreshToken({ userId, clientId, scope = "ashes:brain" }) {
  return sign({
    typ: "mcp_refresh",
    sub: String(userId),
    clientId: String(clientId || ""),
    scope: String(scope || "ashes:brain"),
  }, "30d");
}

export function verifyMcpAccessToken(token) {
  try {
    const payload = jwt.verify(String(token || ""), JWT_SECRET, { issuer: ISSUER, audience: RESOURCE });
    return payload?.typ === "mcp_access" ? payload : null;
  } catch {
    return null;
  }
}

export function verifyMcpRefreshToken(token) {
  try {
    const payload = jwt.verify(String(token || ""), JWT_SECRET, { issuer: ISSUER });
    return payload?.typ === "mcp_refresh" ? payload : null;
  } catch {
    return null;
  }
}

export function pkceChallenge(verifier) {
  return crypto.createHash("sha256").update(String(verifier || "")).digest("base64url");
}

export function bearerFromRequest(req) {
  const header = String(req.headers?.authorization || "");
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

export const oauthIssuer = ISSUER;
export const mcpResource = RESOURCE;

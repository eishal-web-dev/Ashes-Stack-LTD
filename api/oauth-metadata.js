import { oauthIssuer } from "../lib/mcpAuth.js";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=300");
  return res.status(200).json({
    issuer: oauthIssuer,
    authorization_endpoint: `${oauthIssuer}/oauth/authorize`,
    token_endpoint: `${oauthIssuer}/oauth/token`,
    registration_endpoint: `${oauthIssuer}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: ["ashes:brain"],
  });
}

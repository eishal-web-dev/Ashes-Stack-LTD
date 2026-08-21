import mcpHandler from "../lib/mcpRpc.js";
import oauthHandler from "../lib/mcpOAuth.js";
import { mcpResource, oauthIssuer } from "../lib/mcpAuth.js";

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req, res) {
  const route = String(first(req.query.route) || "");

  if (route === "mcp") return mcpHandler(req, res);
  if (route === "oauth") return oauthHandler(req, res);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=300");

  if (route === "resource") {
    return res.status(200).json({
      resource: mcpResource,
      authorization_servers: [oauthIssuer],
      scopes_supported: ["ashes:brain"],
      bearer_methods_supported: ["header"],
      resource_documentation: `${oauthIssuer}/workspace`,
    });
  }

  if (route === "metadata") {
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

  return res.status(404).json({ error: "not_found" });
}

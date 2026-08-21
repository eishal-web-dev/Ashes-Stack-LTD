import { mcpResource, oauthIssuer } from "../lib/mcpAuth.js";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=300");
  return res.status(200).json({
    resource: mcpResource,
    authorization_servers: [oauthIssuer],
    scopes_supported: ["ashes:brain"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${oauthIssuer}/workspace`,
  });
}

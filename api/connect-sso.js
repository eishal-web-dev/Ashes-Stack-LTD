import jwt from "jsonwebtoken";
import { getWorkOSUserFromReq } from "../lib/workspaceAuth.js";

const SSO_SECRET = `${process.env.WORKOS_JWT_SECRET || process.env.JWT_SECRET || "dev-secret-change-me"}:ashes-connect-sso`;
const ISSUER = "ashes-stack";
const AUDIENCE = "ashes-connect";

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
}

function issueTicket(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      name: String(user.name || "Ashes user"),
      email: String(user.email || "").toLowerCase(),
      typ: "ashes_connect_sso",
    },
    SSO_SECRET,
    { issuer: ISSUER, audience: AUDIENCE, expiresIn: "2m" }
  );
}

function verifyTicket(ticket) {
  const payload = jwt.verify(String(ticket || ""), SSO_SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  if (payload?.typ !== "ashes_connect_sso" || !payload?.sub || !payload?.email) {
    throw new Error("Invalid Ashes Connect ticket");
  }
  return payload;
}

export default async function handler(req, res) {
  noStore(res);
  const action = String(req.query?.action || "");

  if (action === "issue") {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    const user = getWorkOSUserFromReq(req);
    if (!user?.id || !user?.email) {
      return res.status(401).json({ error: "Sign in to Ashes first" });
    }
    return res.status(200).json({ ticket: issueTicket(user) });
  }

  if (action === "verify") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    try {
      const payload = verifyTicket(req.body?.ticket);
      return res.status(200).json({
        user: {
          id: String(payload.sub),
          name: String(payload.name || "Ashes user"),
          email: String(payload.email).toLowerCase(),
        },
      });
    } catch {
      return res.status(401).json({ error: "Ashes Connect ticket expired or invalid" });
    }
  }

  return res.status(404).json({ error: "Unknown SSO action" });
}

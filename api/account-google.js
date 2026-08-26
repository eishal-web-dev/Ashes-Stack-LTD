import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { dbConnect } from "../lib/mongodb.js";
import WorkOSUser from "../models/WorkOSUser.js";
import { setWorkOSCookie, signWorkOSSession } from "../lib/workspaceAuth.js";
import { recordAnalytics } from "../lib/analytics.js";

const client = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!client) return res.status(500).json({ error: "Google Sign-In is not configured. Add GOOGLE_CLIENT_ID in Vercel." });

  const idToken = String(req.body?.idToken || "");
  if (!idToken) return res.status(400).json({ error: "Missing Google credential." });

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(401).json({ error: "Google account has no email." });

    const email = payload.email.toLowerCase().trim();
    const name = String(payload.name || email.split("@")[0]).trim().slice(0, 120);

    await dbConnect();
    let user = await WorkOSUser.findOne({ email });
    let created = false;

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      user = await WorkOSUser.create({
        name,
        email,
        password: await bcrypt.hash(randomPassword, 10),
      });
      created = true;
    } else if (!user.name && name) {
      user.name = name;
      await user.save();
    }

    const token = signWorkOSSession({ id: user._id.toString(), name: user.name, email: user.email });
    setWorkOSCookie(res, token);
    await recordAnalytics(created ? "brain_signup" : "brain_login", {
      req,
      brainUser: user._id,
      path: "/login",
      source: "Google / Ashes Account",
    });

    return res.status(200).json({ id: user._id, name: user.name, email: user.email, account: "workos", created });
  } catch (error) {
    return res.status(401).json({ error: "Could not verify Google account." });
  }
}

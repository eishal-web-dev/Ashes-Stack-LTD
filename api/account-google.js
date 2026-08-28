import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { dbConnect } from "../lib/mongodb.js";
import WorkOSUser from "../models/WorkOSUser.js";
import WorkOSSsoCode from "../models/WorkOSSsoCode.js";
import {
  getWorkOSUserFromReq,
  setWorkOSCookie,
  signWorkOSSession,
} from "../lib/workspaceAuth.js";
import { recordAnalytics } from "../lib/analytics.js";

const client = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;
const SAYIT_CALLBACK = "https://aireply-dusky.vercel.app/auth/ashes/callback";
const CONNECT_CALLBACK = "https://ashes-connect-app-ash-d0707d97.vercel.app/auth/ashes/callback";

function allowedReturnUrl(value) {
  return [SAYIT_CALLBACK, CONNECT_CALLBACK].includes(value) ? value : "";
}

async function handleSsoIssue(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const returnUrl = allowedReturnUrl(String(req.query?.return || ""));
  if (!returnUrl) return res.status(400).json({ error: "Invalid return URL" });

  const session = getWorkOSUserFromReq(req);
  if (!session) {
    const next = `/api/account-google?sso=issue&return=${encodeURIComponent(returnUrl)}`;
    return res.redirect(302, `/login?next=${encodeURIComponent(next)}`);
  }

  await dbConnect();
  await WorkOSSsoCode.deleteMany({ expiresAt: { $lte: new Date() } });
  const code = crypto.randomBytes(32).toString("hex");
  await WorkOSSsoCode.create({
    code,
    userId: session.id,
    name: session.name || "",
    email: session.email,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  const redirect = new URL(returnUrl);
  redirect.searchParams.set("code", code);
  return res.redirect(302, redirect.toString());
}

async function handleSsoConsume(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const code = String(req.body?.code || "").trim();
  if (!code) return res.status(400).json({ error: "Missing code" });

  await dbConnect();
  const record = await WorkOSSsoCode.findOneAndDelete({
    code,
    expiresAt: { $gt: new Date() },
  });
  if (!record) return res.status(401).json({ error: "Invalid or expired SSO code" });

  return res.status(200).json({
    id: record.userId.toString(),
    name: record.name,
    email: record.email,
  });
}

async function handleGoogle(req, res) {
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
    const avatar = String(payload.picture || "").trim().slice(0, 1000);

    await dbConnect();
    let user = await WorkOSUser.findOne({ email });
    let created = false;

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      user = await WorkOSUser.create({
        name,
        email,
        avatar,
        password: await bcrypt.hash(randomPassword, 10),
      });
      created = true;
    } else {
      let changed = false;
      if (!user.name && name) { user.name = name; changed = true; }
      if (avatar && user.avatar !== avatar) { user.avatar = avatar; changed = true; }
      if (changed) await user.save();
    }

    const token = signWorkOSSession({ id: user._id.toString(), name: user.name, email: user.email });
    setWorkOSCookie(res, token);
    await recordAnalytics(created ? "brain_signup" : "brain_login", {
      req,
      brainUser: user._id,
      path: "/login",
      source: "Google / Ashes Account",
    });

    return res.status(200).json({ id: user._id, name: user.name, email: user.email, avatar: user.avatar || "", account: "workos", created });
  } catch (error) {
    return res.status(401).json({ error: "Could not verify Google account." });
  }
}

export default async function handler(req, res) {
  const sso = String(req.query?.sso || "");
  try {
    if (sso === "issue") return await handleSsoIssue(req, res);
    if (sso === "consume") return await handleSsoConsume(req, res);
    return await handleGoogle(req, res);
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Authentication failed" });
  }
}

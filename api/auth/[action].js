import { dbConnect } from "../../lib/mongodb.js";
import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { signToken, setAuthCookie, clearAuthCookie, getUserFromReq } from "../../lib/auth.js";
import { logActivity } from "../../lib/logActivity.js";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || process.env.ASHES_ADMIN_EMAILS || "admin@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function doSignup(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  await dbConnect();
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password are required." });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

  const cleanEmail = email.toLowerCase().trim();
  if (await User.findOne({ email: cleanEmail })) return res.status(409).json({ error: "An account with this email already exists." });

  const role = getAdminEmails().includes(cleanEmail) ? "admin" : "client";
  const user = await User.create({ name, email: cleanEmail, password: await bcrypt.hash(password, 10), role });
  const token = signToken({ id: user._id.toString(), role, name: user.name, email: user.email });
  setAuthCookie(res, token);
  res.status(201).json({ id: user._id, role, name: user.name, email: user.email });
  await logActivity(user._id, "account_created", { via: "signup", role });
}

async function doLogin(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  await dbConnect();
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase().trim() });
  if (!user) return res.status(401).json({ error: "Invalid email or password." });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Invalid email or password." });

  const safeRole = user.role === "admin" && !getAdminEmails().includes(user.email.toLowerCase()) ? "client" : user.role;
  const token = signToken({ id: user._id.toString(), role: safeRole, name: user.name, email: user.email });
  setAuthCookie(res, token);
  res.status(200).json({ id: user._id, role: safeRole, name: user.name, email: user.email });
}

function doLogout(req, res) {
  clearAuthCookie(res);
  res.status(200).json({ ok: true });
}

function doMe(req, res) {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  res.status(200).json(user);
}

export default async function handler(req, res) {
  const { action } = req.query;
  try {
    if (action === "signup") return await doSignup(req, res);
    if (action === "login") return await doLogin(req, res);
    if (action === "logout") return doLogout(req, res);
    if (action === "me") return doMe(req, res);
    return res.status(404).json({ error: "Unknown auth action" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

import { dbConnect } from "../../lib/mongodb.js";
import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { getUserFromReq } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });

  await dbConnect();
  const { name, email, password, role, company, project } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters." });
  }
  const cleanEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: cleanEmail });
  if (existing) return res.status(409).json({ error: "An account with this email already exists." });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: cleanEmail,
    password: hashed,
    role: role === "admin" ? "admin" : "client",
    company: company || undefined,
    project: project || undefined,
  });

  res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
}

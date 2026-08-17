import { dbConnect } from "../../../lib/mongodb";
import User from "../../../models/User";
import bcrypt from "bcryptjs";
import { signToken, setAuthCookie } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    await dbConnect();
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: "An account with this email already exists." });

    const hashed = await bcrypt.hash(password, 10);
    const isFirstUser = (await User.countDocuments({})) === 0;
    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashed,
      role: isFirstUser ? "admin" : "client", // first ever signup becomes admin
    });

    const token = signToken({ id: user._id.toString(), role: user.role, name: user.name, email: user.email });
    setAuthCookie(res, token);
    res.status(201).json({ id: user._id, role: user.role, name: user.name, email: user.email });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

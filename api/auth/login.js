import { dbConnect } from "../../lib/mongodb.js";
import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { signToken, setAuthCookie } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    await dbConnect();
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: "Invalid email or password." });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid email or password." });

    const token = signToken({ id: user._id.toString(), role: user.role, name: user.name, email: user.email });
    setAuthCookie(res, token);
    res.status(200).json({ id: user._id, role: user.role, name: user.name, email: user.email });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

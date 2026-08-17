import { dbConnect } from "../../lib/mongodb.js";
import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { getUserFromReq } from "../../lib/auth.js";
import { logActivity } from "../../lib/logActivity.js";

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser) return res.status(401).json({ error: "Not authenticated" });
  await dbConnect();

  if (req.method === "GET") {
    const user = await User.findById(authUser.id).select("-password");
    return res.status(200).json(user);
  }

  if (req.method === "PUT") {
    const { age, gender, googleEmail, phone, notes, name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(authUser.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (googleEmail !== undefined) user.googleEmail = googleEmail;
    if (phone !== undefined) user.phone = phone;
    if (notes !== undefined) user.notes = notes;
    if (name) user.name = name;

    if (email && email.toLowerCase().trim() !== user.email) {
      const cleanEmail = email.toLowerCase().trim();
      const existing = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
      if (existing) return res.status(409).json({ error: "That email is already in use." });
      user.email = cleanEmail;
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: "Enter your current password to set a new one." });
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(401).json({ error: "Current password is incorrect." });
      if (newPassword.length < 4) return res.status(400).json({ error: "New password must be at least 4 characters." });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    const clean = user.toObject();
    delete clean.password;
    await logActivity(user._id, "profile_updated", { passwordChanged: !!newPassword }, authUser.id);
    return res.status(200).json(clean);
  }

  res.status(405).json({ error: "Method not allowed" });
}

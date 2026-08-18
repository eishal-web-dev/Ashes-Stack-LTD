import { dbConnect } from "../lib/mongodb.js";
import { getUserFromReq } from "../lib/auth.js";
import Notification from "../models/Notification.js";

export default async function handler(req, res) {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  await dbConnect();

  if (req.method === "GET") {
    const rows = await Notification.find({ user: user.id }).sort({ createdAt: -1 }).limit(30);
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    const { id, markAll } = req.body || {};
    if (markAll) {
      await Notification.updateMany({ user: user.id, read: false }, { $set: { read: true } });
      return res.status(200).json({ ok: true });
    }
    if (!id) return res.status(400).json({ error: "id is required" });
    const row = await Notification.findOneAndUpdate({ _id: id, user: user.id }, { $set: { read: true } }, { new: true });
    if (!row) return res.status(404).json({ error: "Notification not found" });
    return res.status(200).json(row);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

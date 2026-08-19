import { dbConnect } from "../lib/mongodb.js";
import Notification from "../models/Notification.js";
import { getUserFromReq } from "../lib/auth.js";

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser) return res.status(401).json({ error: "Not authenticated" });
  await dbConnect();

  if (req.method === "GET") {
    const notifications = await Notification.find({ recipient: authUser.id }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: authUser.id, read: false });
    return res.status(200).json({ notifications, unreadCount });
  }

  if (req.method === "POST") {
    const { action, id } = req.body;
    if (action === "mark-read" && id) {
      await Notification.updateOne({ _id: id, recipient: authUser.id }, { read: true });
      return res.status(200).json({ ok: true });
    }
    if (action === "mark-all-read") {
      await Notification.updateMany({ recipient: authUser.id, read: false }, { read: true });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Unknown action" });
  }

  res.status(405).json({ error: "Method not allowed" });
}

import { dbConnect } from "../../lib/mongodb.js";
import ActivityLog from "../../models/ActivityLog.js";
import { getUserFromReq } from "../../lib/auth.js";

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });
  await dbConnect();

  const { clientId } = req.query;
  const filter = clientId ? { client: clientId } : {};
  const logs = await ActivityLog.find(filter)
    .populate("actor", "name role")
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json(logs);
}

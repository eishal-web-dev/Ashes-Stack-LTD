import { dbConnect } from "../../../lib/mongodb";
import User from "../../../models/User";
import DocRecord from "../../../models/DocRecord";
import { getUserFromReq } from "../../../lib/auth";

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });
  await dbConnect();

  const clients = await User.find({ role: "client" }).select("-password").sort({ createdAt: -1 });
  const counts = await DocRecord.aggregate([{ $group: { _id: "$client", count: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

  const result = clients.map((c) => ({ ...c.toObject(), docCount: countMap[c._id.toString()] || 0 }));
  res.status(200).json(result);
}

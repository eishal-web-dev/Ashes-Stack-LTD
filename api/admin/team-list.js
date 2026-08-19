import { dbConnect } from "../../lib/mongodb.js";
import User from "../../models/User.js";
import Task from "../../models/Task.js";
import { getUserFromReq } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });

  try {
    await dbConnect();

    const [team, counts] = await Promise.all([
      User.find({ role: "team" }).select("-password").sort({ createdAt: -1 }),
      Task.aggregate([
        { $match: { assignedTo: { $ne: null } } },
        { $group: { _id: { assignedTo: "$assignedTo", status: "$status" }, count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = {};
    for (const row of counts) {
      const assignedTo = row?._id?.assignedTo;
      const status = row?._id?.status;
      if (!assignedTo || !["todo", "in_progress", "done"].includes(status)) continue;
      const key = assignedTo.toString();
      if (!countMap[key]) countMap[key] = { todo: 0, in_progress: 0, done: 0 };
      countMap[key][status] = row.count;
    }

    const result = team.map((member) => ({
      ...member.toObject(),
      taskCounts: countMap[member._id.toString()] || { todo: 0, in_progress: 0, done: 0 },
    }));

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json(result);
  } catch (error) {
    console.error("Admin team-list failed", error);
    return res.status(500).json({ error: error?.message || "Could not load team members" });
  }
}

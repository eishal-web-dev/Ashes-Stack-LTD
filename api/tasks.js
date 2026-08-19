import { dbConnect } from "../lib/mongodb.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { getUserFromReq } from "../lib/auth.js";
import { notify } from "../lib/notify.js";
import { logActivity } from "../lib/logActivity.js";

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser) return res.status(401).json({ error: "Not authenticated" });
  await dbConnect();

  if (req.method === "GET") {
    let filter = {};
    if (authUser.role === "team") {
      filter.assignedTo = authUser.id;
    } else if (authUser.role === "admin") {
      if (req.query.teamMemberId) filter.assignedTo = req.query.teamMemberId;
    } else {
      return res.status(403).json({ error: "Not allowed" });
    }
    const tasks = await Task.find(filter)
      .populate({ path: "assignedTo", select: "name email", model: User })
      .populate({ path: "relatedClient", select: "name company", model: User })
      .sort({ createdAt: -1 });
    return res.status(200).json(tasks);
  }

  if (req.method === "POST") {
    const { action } = req.body;

    if (action === "create") {
      if (authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const { title, description, assignedTo, relatedClient, dueDate } = req.body;
      if (!title || !assignedTo) return res.status(400).json({ error: "title and assignedTo are required" });
      const task = await Task.create({
        title,
        description: description || undefined,
        assignedTo,
        assignedBy: authUser.id,
        relatedClient: relatedClient || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      await notify(assignedTo, { type: "task_assigned", title: "New task assigned", message: title, link: "/team" });
      await logActivity(assignedTo, "task_assigned", { title }, authUser.id);
      return res.status(201).json(task);
    }

    if (action === "update-status") {
      const { id, status } = req.body;
      if (!["todo", "in_progress", "done"].includes(status)) return res.status(400).json({ error: "Invalid status" });
      const task = await Task.findById(id);
      if (!task) return res.status(404).json({ error: "Task not found" });
      const isOwner = task.assignedTo.toString() === authUser.id;
      if (authUser.role !== "admin" && !isOwner) return res.status(403).json({ error: "Not your task" });
      task.status = status;
      await task.save();
      return res.status(200).json(task);
    }

    if (action === "delete") {
      if (authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });
      const { id } = req.body;
      await Task.findByIdAndDelete(id);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  res.status(405).json({ error: "Method not allowed" });
}

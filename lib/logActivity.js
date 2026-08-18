import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";

export async function logActivity(clientId, action, meta = {}, actorId = null) {
  try {
    await ActivityLog.create({ client: clientId, action, meta, actor: actorId || undefined });
    if (action === "task_assigned") {
      await Notification.create({
        user: clientId,
        title: "New task assigned",
        message: meta.title || "A new task has been assigned to you.",
        kind: "task",
        href: "/team#tasks",
        meta,
      });
    }
  } catch (e) {
    console.error("logActivity failed:", e.message);
  }
}

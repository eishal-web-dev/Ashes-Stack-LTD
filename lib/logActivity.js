import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";

const notificationFor = (action, meta = {}) => {
  if (action === "document_sent") return {
    title: "New document from Ashes",
    message: meta.title ? `${meta.title} is ready in your portal.` : "A new document is ready in your portal.",
    kind: "document",
    href: "/portal#documents",
  };
  if (action === "appointment_letter_sent") return {
    title: "Appointment letter received",
    message: meta.title ? `${meta.title} is ready to view.` : "Your Ashes appointment letter is ready to view.",
    kind: "appointment",
    href: "/team#documents",
  };
  if (action === "task_assigned") return {
    title: "New task assigned",
    message: meta.title || "A new task has been assigned to you.",
    kind: "task",
    href: "/team#tasks",
  };
  return null;
};

export async function logActivity(clientId, action, meta = {}, actorId = null) {
  try {
    await ActivityLog.create({ client: clientId, action, meta, actor: actorId || undefined });
    const n = notificationFor(action, meta);
    if (n) await Notification.create({ user: clientId, ...n, meta });
  } catch (e) {
    // Never let logging/notification failure break the actual request.
    console.error("logActivity failed:", e.message);
  }
}

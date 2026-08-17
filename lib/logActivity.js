import ActivityLog from "../models/ActivityLog.js";

export async function logActivity(clientId, action, meta = {}, actorId = null) {
  try {
    await ActivityLog.create({ client: clientId, action, meta, actor: actorId || undefined });
  } catch (e) {
    // Never let logging failure break the actual request
    console.error("logActivity failed:", e.message);
  }
}

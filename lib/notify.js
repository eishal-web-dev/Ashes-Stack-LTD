import Notification from "../models/Notification.js";

export async function notify(recipientId, { type, title, message, link }) {
  try {
    await Notification.create({ recipient: recipientId, type, title, message, link });
  } catch (e) {
    console.error("notify failed:", e.message);
  }
}

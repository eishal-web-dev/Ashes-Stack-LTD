import { dbConnect } from "../../lib/mongodb.js";
import User from "../../models/User.js";
import DocRecord from "../../models/DocRecord.js";
import { getUserFromReq } from "../../lib/auth.js";
import { generateDocPdf } from "../../lib/pdfTemplates.js";
import { logActivity } from "../../lib/logActivity.js";

const TITLES = {
  welcome: "Welcome Packet",
  contract: "Service Agreement / Contract",
  invoice: "Invoice",
  access_request: "Access / Information Request",
  monthly_report: "Monthly Progress Report",
  fulfillment: "Fulfillment & Handover Confirmation",
  feedback_request: "Feedback Request",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });

  await dbConnect();
  const { clientId, type, meta } = req.body;
  if (!clientId || !type) return res.status(400).json({ error: "clientId and type are required" });

  const client = await User.findById(clientId);
  if (!client) return res.status(404).json({ error: "Client not found" });

  try {
    const pdfBytes = await generateDocPdf(type, client, meta || {});
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    const doc = await DocRecord.create({
      client: client._id,
      type,
      title: TITLES[type] || type,
      meta: meta || {},
      pdfBase64,
      sentBy: authUser.id,
    });

    res.status(201).json({ id: doc._id, title: doc.title, type: doc.type, createdAt: doc.createdAt });
    await logActivity(client._id, "document_sent", { type: doc.type, title: doc.title }, authUser.id);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

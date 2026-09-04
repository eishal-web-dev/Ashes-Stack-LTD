import { dbConnect } from "../../../lib/mongodb.js";
import DocRecord from "../../../models/DocRecord.js";
import { getUserFromReq } from "../../../lib/auth.js";
import { logActivity } from "../../../lib/logActivity.js";

async function doDownload(req, res, doc, authUser) {
  if (authUser.role !== "admin" && doc.client.toString() !== authUser.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (doc.status === "sent" && authUser.role !== "admin") {
    doc.status = "downloaded";
    await doc.save();
    await logActivity(doc.client, "document_downloaded", { type: doc.type, title: doc.title }, authUser.id);
  }
  const buffer = Buffer.from(doc.pdfBase64, "base64");
  const mimeType = doc.mimeType || "application/pdf";
  const fallbackExt = mimeType === "application/pdf" ? ".pdf" : "";
  const fileName = doc.fileName || `${doc.title.replace(/[^a-z0-9]/gi, "_")}${fallbackExt}`;
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
  res.status(200).send(buffer);
}

async function doSign(req, res, doc, authUser) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (doc.client.toString() !== authUser.id) return res.status(403).json({ error: "Forbidden" });
  if (doc.type !== "contract") return res.status(400).json({ error: "Only contracts can be signed." });

  const { signedByName } = req.body;
  if (!signedByName || !signedByName.trim()) {
    return res.status(400).json({ error: "Type your full name to sign." });
  }

  doc.signedAt = new Date();
  doc.signedByName = signedByName.trim();
  await doc.save();
  await logActivity(doc.client, "document_signed", { title: doc.title, signedByName: doc.signedByName }, authUser.id);
  res.status(200).json({ id: doc._id, signedAt: doc.signedAt, signedByName: doc.signedByName });
}

async function doPayment(req, res, doc, authUser) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });
  if (doc.type !== "invoice") return res.status(400).json({ error: "Only invoices have a payment status." });

  const { paid } = req.body;
  doc.paymentStatus = paid ? "paid" : "unpaid";
  doc.paidAt = paid ? new Date() : undefined;
  await doc.save();
  await logActivity(doc.client, paid ? "payment_marked_paid" : "payment_marked_unpaid", { title: doc.title }, authUser.id);
  res.status(200).json({ id: doc._id, paymentStatus: doc.paymentStatus, paidAt: doc.paidAt });
}

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser) return res.status(401).json({ error: "Not authenticated" });
  await dbConnect();

  const doc = await DocRecord.findById(req.query.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });

  const { action } = req.query;
  try {
    if (action === "download") return await doDownload(req, res, doc, authUser);
    if (action === "sign") return await doSign(req, res, doc, authUser);
    if (action === "payment") return await doPayment(req, res, doc, authUser);
    return res.status(404).json({ error: "Unknown document action" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

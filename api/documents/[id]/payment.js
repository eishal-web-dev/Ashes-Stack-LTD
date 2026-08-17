import { dbConnect } from "../../../lib/mongodb.js";
import DocRecord from "../../../models/DocRecord.js";
import { getUserFromReq } from "../../../lib/auth.js";
import { logActivity } from "../../../lib/logActivity.js";

// Admin marks an invoice as paid/unpaid.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });
  await dbConnect();

  const doc = await DocRecord.findById(req.query.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  if (doc.type !== "invoice") return res.status(400).json({ error: "Only invoices have a payment status." });

  const { paid } = req.body;
  doc.paymentStatus = paid ? "paid" : "unpaid";
  doc.paidAt = paid ? new Date() : undefined;
  await doc.save();
  await logActivity(doc.client, paid ? "payment_marked_paid" : "payment_marked_unpaid", { title: doc.title }, authUser.id);

  res.status(200).json({ id: doc._id, paymentStatus: doc.paymentStatus, paidAt: doc.paidAt });
}

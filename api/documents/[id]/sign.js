import { dbConnect } from "../../../lib/mongodb.js";
import DocRecord from "../../../models/DocRecord.js";
import { getUserFromReq } from "../../../lib/auth.js";
import { logActivity } from "../../../lib/logActivity.js";

// Client-side e-signature: the client types their name to approve a contract.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const authUser = getUserFromReq(req);
  if (!authUser) return res.status(401).json({ error: "Not authenticated" });
  await dbConnect();

  const doc = await DocRecord.findById(req.query.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
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

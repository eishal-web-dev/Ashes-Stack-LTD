import { dbConnect } from "../../../lib/mongodb.js";
import DocRecord from "../../../models/DocRecord.js";
import { getUserFromReq } from "../../../lib/auth.js";
import { logActivity } from "../../../lib/logActivity.js";

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser) return res.status(401).json({ error: "Not authenticated" });
  await dbConnect();

  const doc = await DocRecord.findById(req.query.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });

  if (authUser.role === "client" && doc.client.toString() !== authUser.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (doc.status === "sent" && authUser.role === "client") {
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

import { dbConnect } from "../../../lib/mongodb.js";
import DocRecord from "../../../models/DocRecord.js";
import { getUserFromReq } from "../../../lib/auth.js";

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
  }

  const buffer = Buffer.from(doc.pdfBase64, "base64");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${doc.title.replace(/[^a-z0-9]/gi, "_")}.pdf"`);
  res.status(200).send(buffer);
}

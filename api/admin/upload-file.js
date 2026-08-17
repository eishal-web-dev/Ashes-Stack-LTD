import { dbConnect } from "../../lib/mongodb.js";
import User from "../../models/User.js";
import DocRecord from "../../models/DocRecord.js";
import { getUserFromReq } from "../../lib/auth.js";

// Vercel serverless functions cap request bodies around 4.5MB.
// This is fine for PDFs/images but not for video — those need
// external file storage (e.g. Vercel Blob) instead of base64-in-Mongo.
const MAX_BASE64_LENGTH = 6_000_000; // ~4.3MB of actual file data

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });

  await dbConnect();
  const { clientId, title, fileName, mimeType, fileBase64 } = req.body;
  if (!clientId || !title || !fileBase64) {
    return res.status(400).json({ error: "clientId, title and fileBase64 are required" });
  }
  if (fileBase64.length > MAX_BASE64_LENGTH) {
    return res.status(413).json({
      error: "File is too large for direct upload (limit ~4MB). For videos or large files, share a Google Drive/WeTransfer link instead, or ask about adding cloud file storage.",
    });
  }

  const client = await User.findById(clientId);
  if (!client) return res.status(404).json({ error: "Client not found" });

  const doc = await DocRecord.create({
    client: client._id,
    type: "custom_file",
    title,
    fileName: fileName || title,
    mimeType: mimeType || "application/octet-stream",
    pdfBase64: fileBase64,
    sentBy: authUser.id,
  });

  res.status(201).json({ id: doc._id, title: doc.title, type: doc.type, createdAt: doc.createdAt });
}

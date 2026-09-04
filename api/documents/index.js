import { dbConnect } from "../../lib/mongodb.js";
import DocRecord from "../../models/DocRecord.js";
import { getUserFromReq } from "../../lib/auth.js";

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser) return res.status(401).json({ error: "Not authenticated" });
  await dbConnect();

  if (req.method === "GET") {
    let filter = {};
    if (authUser.role === "client" || authUser.role === "team") {
      filter.client = authUser.id;
    } else if (req.query.clientId) {
      filter.client = req.query.clientId;
    }
    const docs = await DocRecord.find(filter).select("-pdfBase64").sort({ createdAt: -1 });
    return res.status(200).json(docs);
  }

  if (req.method === "DELETE") {
    if (authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId is required" });
    const result = await DocRecord.deleteMany({ client: clientId });
    return res.status(200).json({ ok: true, deletedCount: result.deletedCount });
  }

  res.status(405).json({ error: "Method not allowed" });
}

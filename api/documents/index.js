import { dbConnect } from "../../lib/mongodb.js";
import DocRecord from "../../models/DocRecord.js";
import { getUserFromReq } from "../../lib/auth.js";

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser) return res.status(401).json({ error: "Not authenticated" });
  await dbConnect();

  if (req.method === "GET") {
    let filter = {};
    if (authUser.role === "client") {
      filter.client = authUser.id;
    } else if (req.query.clientId) {
      filter.client = req.query.clientId;
    }
    const docs = await DocRecord.find(filter).select("-pdfBase64").sort({ createdAt: -1 });
    return res.status(200).json(docs);
  }

  res.status(405).json({ error: "Method not allowed" });
}

import { dbConnect } from "../../../lib/mongodb.js";
import DocRecord from "../../../models/DocRecord.js";
import { getUserFromReq } from "../../../lib/auth.js";

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });
  await dbConnect();

  if (req.method === "DELETE") {
    const doc = await DocRecord.findByIdAndDelete(req.query.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    return res.status(200).json({ ok: true, id: doc._id });
  }

  res.status(405).json({ error: "Method not allowed" });
}

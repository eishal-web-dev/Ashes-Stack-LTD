import { getUserFromReq } from "../../lib/auth.js";
export default function handler(req, res) {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  res.status(200).json(user);
}

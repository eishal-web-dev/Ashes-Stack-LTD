import { dbConnect } from "../../lib/mongodb.js";
import User from "../../models/User.js";
import { getUserFromReq } from "../../lib/auth.js";

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser) return res.status(401).json({ error: "Not authenticated" });
  await dbConnect();

  if (req.method === "GET") {
    const user = await User.findById(authUser.id).select("-password");
    return res.status(200).json(user);
  }

  if (req.method === "PUT") {
    const { age, gender, googleEmail, phone, notes } = req.body;
    const user = await User.findByIdAndUpdate(
      authUser.id,
      { age, gender, googleEmail, phone, notes },
      { new: true }
    ).select("-password");
    return res.status(200).json(user);
  }

  res.status(405).json({ error: "Method not allowed" });
}

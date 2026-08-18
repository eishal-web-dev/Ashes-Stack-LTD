import { dbConnect } from "../lib/mongodb.js";
import Review from "../models/Review.js";
import { getUserFromReq } from "../lib/auth.js";
import { logActivity } from "../lib/logActivity.js";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    // Public — anyone can read reviews (used on the public /reviews page).
    const reviews = await Review.find({}).sort({ createdAt: -1 }).limit(100);
    return res.status(200).json(reviews);
  }

  if (req.method === "POST") {
    const authUser = getUserFromReq(req);
    if (!authUser || authUser.role !== "client") {
      return res.status(403).json({ error: "Only clients can leave a review." });
    }
    const { rating, comment, clientName, company } = req.body;
    const r = Number(rating);
    if (!r || r < 1 || r > 5) return res.status(400).json({ error: "Rating must be between 1 and 5." });

    const review = await Review.findOneAndUpdate(
      { client: authUser.id },
      {
        client: authUser.id,
        clientName: clientName || authUser.name,
        company: company || undefined,
        rating: r,
        comment: (comment || "").slice(0, 800),
      },
      { upsert: true, new: true }
    );

    await logActivity(authUser.id, "review_submitted", { rating: r }, authUser.id);
    return res.status(200).json(review);
  }

  if (req.method === "DELETE") {
    const authUser = getUserFromReq(req);
    if (!authUser || authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id is required" });
    await Review.findByIdAndDelete(id);
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}

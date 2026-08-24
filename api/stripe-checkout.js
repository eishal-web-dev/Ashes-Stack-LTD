import { dbConnect } from "../lib/mongodb.js";
import { createCheckoutSession } from "../lib/stripeBilling.js";
import { getWorkOSUserFromReq } from "../lib/workspaceAuth.js";
import WorkOSUser from "../models/WorkOSUser.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const session = getWorkOSUserFromReq(req);
  if (!session) return res.status(401).json({ error: "Sign in to Ashes Brain first." });

  try {
    await dbConnect();
    const user = await WorkOSUser.findById(session.id);
    if (!user) return res.status(404).json({ error: "Brain account not found" });
    if (user.plan === "pro" && user.billing?.customerId) {
      return res.status(409).json({ error: "Your Pro plan is already active. Use Manage Pro instead." });
    }
    const checkout = await createCheckoutSession(user);
    return res.status(200).json({ checkoutUrl: checkout.url });
  } catch (error) {
    console.error("Stripe checkout error", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Checkout unavailable" });
  }
}

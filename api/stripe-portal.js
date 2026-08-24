import { dbConnect } from "../lib/mongodb.js";
import { createPortalSession } from "../lib/stripeBilling.js";
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
    if (!user.billing?.customerId || user.billing?.provider !== "stripe") {
      return res.status(400).json({ error: "No Stripe subscription is attached to this Brain account yet." });
    }
    const portal = await createPortalSession(user.billing.customerId);
    return res.status(200).json({ portalUrl: portal.url });
  } catch (error) {
    console.error("Stripe portal error", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Billing portal unavailable" });
  }
}

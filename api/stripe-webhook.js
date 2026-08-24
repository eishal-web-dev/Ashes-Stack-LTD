import { dbConnect } from "../lib/mongodb.js";
import { planForStripeStatus, readRawBody, unixDate, verifyStripeSignature } from "../lib/stripeBilling.js";
import WorkOSUser from "../models/WorkOSUser.js";

export const config = { api: { bodyParser: false } };

function idOf(value) {
  return typeof value === "string" ? value : String(value?.id || "");
}

async function updateSubscription(subscription, forcedUserId = "") {
  const userId = String(subscription?.metadata?.user_id || forcedUserId || "");
  const customerId = idOf(subscription?.customer);
  const subscriptionId = idOf(subscription?.id);
  const query = /^[a-f0-9]{24}$/i.test(userId)
    ? { _id: userId }
    : customerId
      ? { "billing.customerId": customerId }
      : { "billing.subscriptionId": subscriptionId };
  const status = String(subscription?.status || "active");
  await WorkOSUser.updateOne(query, {
    $set: {
      plan: planForStripeStatus(status),
      "billing.provider": "stripe",
      "billing.subscriptionId": subscriptionId,
      "billing.customerId": customerId,
      "billing.variantId": idOf(subscription?.items?.data?.[0]?.price),
      "billing.status": status,
      "billing.renewsAt": unixDate(subscription?.current_period_end),
      "billing.endsAt": unixDate(subscription?.cancel_at || subscription?.ended_at),
      "billing.portalUrl": "",
      "billing.updatedAt": new Date(),
    },
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const rawBody = await readRawBody(req);
  if (!verifyStripeSignature(rawBody, req.headers["stripe-signature"])) {
    return res.status(400).json({ error: "Invalid Stripe signature" });
  }

  let event;
  try { event = JSON.parse(rawBody); }
  catch { return res.status(400).json({ error: "Invalid JSON" }); }

  try {
    await dbConnect();
    const object = event?.data?.object || {};
    if (event.type === "checkout.session.completed" && object.mode === "subscription") {
      const userId = String(object.client_reference_id || object.metadata?.user_id || "");
      await updateSubscription({
        id: object.subscription,
        customer: object.customer,
        status: object.payment_status === "paid" ? "active" : "incomplete",
        metadata: { user_id: userId },
      }, userId);
    } else if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      await updateSubscription(object);
    } else if (event.type === "invoice.paid") {
      await WorkOSUser.updateOne(
        { "billing.customerId": idOf(object.customer) },
        { $set: { plan: "pro", "billing.status": "active", "billing.updatedAt": new Date() } }
      );
    } else if (event.type === "invoice.payment_failed") {
      await WorkOSUser.updateOne(
        { "billing.customerId": idOf(object.customer) },
        { $set: { "billing.status": "past_due", "billing.updatedAt": new Date() } }
      );
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

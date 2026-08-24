import crypto from "node:crypto";
import { dbConnect } from "../lib/mongodb.js";
import Notification from "../models/Notification.js";
import WorkOSUser from "../models/WorkOSUser.js";
import { getUserFromReq } from "../lib/auth.js";
import { getWorkOSUserFromReq } from "../lib/workspaceAuth.js";
import { createCheckoutSession, createPortalSession, planForStripeStatus, readRawBody as readStripeRawBody, unixDate, verifyStripeSignature } from "../lib/stripeBilling.js";
import {
  BRAIN_PLANS,
  buildCheckoutUrl,
  checkoutBaseForPlan,
  hasPaidAccess,
  planFromWebhook,
  readRawBody,
  verifyLemonSignature,
} from "../lib/lemonBilling.js";

export const config = { api: { bodyParser: false } };

async function parseJsonBody(req) {
  const raw = await readRawBody(req);
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch { return {}; }
}

async function handleLemonWebhook(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const rawBody = await readRawBody(req);
  const signature = req.headers["x-signature"];
  if (!verifyLemonSignature(rawBody, signature)) return res.status(401).json({ error: "Invalid signature" });

  let payload;
  try { payload = JSON.parse(rawBody); }
  catch { return res.status(400).json({ error: "Invalid JSON" }); }

  const eventName = String(payload?.meta?.event_name || req.headers["x-event-name"] || "");
  const supported = new Set([
    "subscription_created",
    "subscription_updated",
    "subscription_cancelled",
    "subscription_resumed",
    "subscription_expired",
    "subscription_paused",
  ]);
  if (!supported.has(eventName)) return res.status(200).json({ ok: true, ignored: eventName || "unknown" });

  const userId = String(payload?.meta?.custom_data?.user_id || "");
  if (!/^[a-f0-9]{24}$/i.test(userId)) return res.status(200).json({ ok: true, ignored: "missing user" });

  await dbConnect();
  const attrs = payload?.data?.attributes || {};
  const status = String(attrs.status || "");
  const endsAt = attrs.ends_at || null;
  const paidPlan = planFromWebhook(payload);
  const plan = hasPaidAccess(status, endsAt) ? paidPlan : "free";
  const portalUrl = String(attrs?.urls?.customer_portal || attrs?.urls?.customer_portal_update_subscription || "");

  await WorkOSUser.updateOne(
    { _id: userId },
    {
      $set: {
        plan,
        "billing.provider": "lemonsqueezy",
        "billing.subscriptionId": String(payload?.data?.id || ""),
        "billing.customerId": String(attrs.customer_id || ""),
        "billing.variantId": String(attrs.variant_id || ""),
        "billing.status": status,
        "billing.renewsAt": attrs.renews_at ? new Date(attrs.renews_at) : null,
        "billing.endsAt": endsAt ? new Date(endsAt) : null,
        "billing.portalUrl": portalUrl,
        "billing.updatedAt": new Date(),
      },
    }
  );

  return res.status(200).json({ ok: true });
}

async function handleBrainBilling(req, res, action) {
  const session = getWorkOSUserFromReq(req);
  if (!session) return res.status(401).json({ error: "Sign in to Ashes Brain first." });
  await dbConnect();
  const user = await WorkOSUser.findById(session.id);
  if (!user) return res.status(404).json({ error: "Brain account not found" });

  if (action === "status") {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const plan = BRAIN_PLANS[user.plan] || BRAIN_PLANS.free;
    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      plan: plan.id,
      planName: plan.name,
      limits: { projects: plan.projectLimit, memoriesPerProject: plan.memoryLimit },
      billing: {
        status: user.billing?.status || "",
        renewsAt: user.billing?.renewsAt || null,
        endsAt: user.billing?.endsAt || null,
        portalUrl: user.billing?.portalUrl || "",
      },
      checkoutConfigured: true,
    });
  }

  if (action === "paddle-portal") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!user.billing?.customerId || user.billing?.provider !== "paddle") {
      return res.status(400).json({ error: "No Paddle subscription is attached to this Brain account yet." });
    }
    const apiKey = String(process.env.PADDLE_API_KEY || "");
    if (!apiKey) return res.status(503).json({ error: "Paddle subscription management is not configured yet." });
    try {
      const body = user.billing?.subscriptionId
        ? { subscription_ids: [user.billing.subscriptionId] }
        : {};
      const response = await fetch(`https://sandbox-api.paddle.com/customers/${encodeURIComponent(user.billing.customerId)}/portal-sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        const detail = payload?.error?.detail || payload?.error?.type || "Paddle customer portal unavailable";
        throw new Error(detail);
      }
      const portalUrl = payload?.data?.urls?.general?.overview || "";
      if (!portalUrl) throw new Error("Paddle did not return a customer portal link.");
      return res.status(200).json({ portalUrl });
    } catch (error) {
      console.error("Paddle portal error", error);
      return res.status(500).json({ error: error instanceof Error ? error.message : "Billing portal unavailable" });
    }
  }

  if (action === "stripe-checkout") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (user.plan === "pro" && user.billing?.customerId) {
      return res.status(409).json({ error: "Your Pro plan is already active. Use Manage Pro instead." });
    }
    try {
      const checkout = await createCheckoutSession(user);
      return res.status(200).json({ checkoutUrl: checkout.url });
    } catch (error) {
      console.error("Stripe checkout error", error);
      return res.status(500).json({ error: error instanceof Error ? error.message : "Checkout unavailable" });
    }
  }

  if (action === "stripe-portal") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!user.billing?.customerId || user.billing?.provider !== "stripe") {
      return res.status(400).json({ error: "No Stripe subscription is attached to this Brain account yet." });
    }
    try {
      const portal = await createPortalSession(user.billing.customerId);
      return res.status(200).json({ portalUrl: portal.url });
    } catch (error) {
      console.error("Stripe portal error", error);
      return res.status(500).json({ error: error instanceof Error ? error.message : "Billing portal unavailable" });
    }
  }

  if (action === "checkout") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const body = await parseJsonBody(req);
    const plan = String(body?.plan || "").toLowerCase();
    if (plan !== "pro") return res.status(400).json({ error: "Only Ashes Brain Pro is available right now." });
    const base = checkoutBaseForPlan(plan);
    if (!base) return res.status(503).json({ error: "Checkout is being connected. Try again after the store is activated." });
    return res.status(200).json({ checkoutUrl: buildCheckoutUrl(base, user, plan) });
  }

  return res.status(404).json({ error: "Unknown billing action" });
}


function verifyPaddleSignature(rawBody, signatureHeader) {
  const secret = String(process.env.PADDLE_WEBHOOK_SECRET || "");
  if (!secret || !signatureHeader) return false;
  const parts = String(signatureHeader).split(";").reduce((all, part) => {
    const [key, value] = part.split("=");
    if (key && value) all[key.trim()] = value.trim();
    return all;
  }, {});
  if (!parts.ts || !parts.h1) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${parts.ts}:${rawBody}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(parts.h1, "hex"));
  } catch {
    return false;
  }
}

function paddleId(value) {
  return typeof value === "string" ? value : String(value?.id || "");
}

function paddlePlanForStatus(status) {
  return ["active", "trialing", "past_due"].includes(String(status)) ? "pro" : "free";
}

async function updatePaddleSubscription(data, forcedUserId = "") {
  const userId = String(data?.custom_data?.user_id || forcedUserId || "");
  const customerId = paddleId(data?.customer_id);
  const subscriptionId = paddleId(data?.subscription_id || data?.id);
  const query = /^[a-f0-9]{24}$/i.test(userId)
    ? { _id: userId }
    : customerId
      ? { "billing.customerId": customerId }
      : { "billing.subscriptionId": subscriptionId };
  const status = String(data?.status || "active");
  const itemPriceId = paddleId(data?.items?.[0]?.price?.id || data?.items?.[0]?.price_id);
  const endsAt = data?.scheduled_change?.effective_at || data?.canceled_at || null;

  await WorkOSUser.updateOne(query, {
    $set: {
      plan: paddlePlanForStatus(status),
      "billing.provider": "paddle",
      "billing.subscriptionId": subscriptionId,
      "billing.customerId": customerId,
      "billing.variantId": itemPriceId,
      "billing.status": status,
      "billing.renewsAt": data?.next_billed_at ? new Date(data.next_billed_at) : null,
      "billing.endsAt": endsAt ? new Date(endsAt) : null,
      "billing.portalUrl": "",
      "billing.updatedAt": new Date(),
    },
  });
}

async function handlePaddleWebhook(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const rawBody = await readRawBody(req);
  if (!verifyPaddleSignature(rawBody, req.headers["paddle-signature"])) {
    return res.status(400).json({ error: "Invalid Paddle signature" });
  }

  let event;
  try { event = JSON.parse(rawBody); }
  catch { return res.status(400).json({ error: "Invalid JSON" }); }

  try {
    await dbConnect();
    const data = event?.data || {};
    if (event?.event_type === "transaction.completed" && data?.subscription_id) {
      await updatePaddleSubscription({
        ...data,
        id: data.subscription_id,
        status: "active",
      });
    } else if ([
      "subscription.created",
      "subscription.activated",
      "subscription.updated",
      "subscription.resumed",
      "subscription.paused",
      "subscription.canceled",
      "subscription.past_due",
    ].includes(event?.event_type)) {
      await updatePaddleSubscription(data);
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Paddle webhook error", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}


function stripeId(value) {
  return typeof value === "string" ? value : String(value?.id || "");
}

async function updateStripeSubscription(subscription, forcedUserId = "") {
  const userId = String(subscription?.metadata?.user_id || forcedUserId || "");
  const customerId = stripeId(subscription?.customer);
  const subscriptionId = stripeId(subscription?.id);
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
      "billing.variantId": stripeId(subscription?.items?.data?.[0]?.price),
      "billing.status": status,
      "billing.renewsAt": unixDate(subscription?.current_period_end),
      "billing.endsAt": unixDate(subscription?.cancel_at || subscription?.ended_at),
      "billing.portalUrl": "",
      "billing.updatedAt": new Date(),
    },
  });
}

async function handleStripeWebhook(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const rawBody = await readStripeRawBody(req);
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
      await updateStripeSubscription({
        id: object.subscription,
        customer: object.customer,
        status: object.payment_status === "paid" ? "active" : "incomplete",
        metadata: { user_id: userId },
      }, userId);
    } else if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      await updateStripeSubscription(object);
    } else if (event.type === "invoice.paid") {
      await WorkOSUser.updateOne(
        { "billing.customerId": stripeId(object.customer) },
        { $set: { plan: "pro", "billing.status": "active", "billing.updatedAt": new Date() } }
      );
    } else if (event.type === "invoice.payment_failed") {
      await WorkOSUser.updateOne(
        { "billing.customerId": stripeId(object.customer) },
        { $set: { "billing.status": "past_due", "billing.updatedAt": new Date() } }
      );
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

export default async function handler(req, res) {
  const paddleAction = String(req.query?.paddle || "");
  if (paddleAction === "webhook") return handlePaddleWebhook(req, res);
  const stripeAction = String(req.query?.stripe || "");
  if (stripeAction === "webhook") return handleStripeWebhook(req, res);
  const lemonAction = String(req.query?.lemon || "");
  if (lemonAction === "webhook") return handleLemonWebhook(req, res);

  const billingAction = String(req.query?.billing || "");
  if (billingAction) return handleBrainBilling(req, res, billingAction);

  const authUser = getUserFromReq(req);
  if (!authUser) return res.status(401).json({ error: "Not authenticated" });
  await dbConnect();

  if (req.method === "GET") {
    const notifications = await Notification.find({ recipient: authUser.id }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: authUser.id, read: false });
    return res.status(200).json({ notifications, unreadCount });
  }

  if (req.method === "POST") {
    const body = await parseJsonBody(req);
    const { action, id } = body;
    if (action === "mark-read" && id) {
      await Notification.updateOne({ _id: id, recipient: authUser.id }, { read: true });
      return res.status(200).json({ ok: true });
    }
    if (action === "mark-all-read") {
      await Notification.updateMany({ recipient: authUser.id, read: false }, { read: true });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Unknown action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

import crypto from "node:crypto";

const STRIPE_API = "https://api.stripe.com/v1";
const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);

function configured(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function appUrl() {
  return String(process.env.APP_URL || process.env.VITE_APP_URL || "https://www.ashesstack.cloud").replace(/\/$/, "");
}

export async function stripeRequest(path, values = {}) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== "") body.set(key, String(value));
  }
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${configured("STRIPE_SECRET_KEY")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Stripe request failed");
  return data;
}

export async function createCheckoutSession(user) {
  const values = {
    mode: "subscription",
    "line_items[0][price]": configured("STRIPE_PRO_PRICE_ID"),
    "line_items[0][quantity]": 1,
    success_url: `${appUrl()}/pricing?checkout=success`,
    cancel_url: `${appUrl()}/pricing?checkout=cancelled`,
    client_reference_id: String(user._id),
    "metadata[user_id]": String(user._id),
    "metadata[plan]": "pro",
    "subscription_data[metadata][user_id]": String(user._id),
    "subscription_data[metadata][plan]": "pro",
    allow_promotion_codes: "true",
  };
  if (user.billing?.customerId && user.billing?.provider === "stripe") {
    values.customer = user.billing.customerId;
  } else {
    values.customer_email = user.email;
  }
  return stripeRequest("/checkout/sessions", values);
}

export function createPortalSession(customerId) {
  return stripeRequest("/billing_portal/sessions", {
    customer: customerId,
    return_url: `${appUrl()}/pricing`,
  });
}

export function verifyStripeSignature(rawBody, header) {
  const secret = String(process.env.STRIPE_WEBHOOK_SECRET || "");
  if (!secret || !rawBody || !header) return false;
  const entries = String(header).split(",").map((entry) => entry.split("="));
  const timestamp = entries.find(([key]) => key === "t")?.[1];
  const signatures = entries.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return signatures.some((signature) => {
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

export async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

export function planForStripeStatus(status) {
  return PAID_STATUSES.has(String(status || "").toLowerCase()) ? "pro" : "free";
}

export function unixDate(value) {
  return Number.isFinite(Number(value)) ? new Date(Number(value) * 1000) : null;
}

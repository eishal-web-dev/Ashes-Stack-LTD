import crypto from "node:crypto";

export const BRAIN_PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    projectLimit: 1,
    memoryLimit: 50,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 9.99,
    projectLimit: 25,
    memoryLimit: 250,
  },
  team: {
    id: "team",
    name: "Team",
    price: 29,
    projectLimit: 100,
    memoryLimit: 250,
  },
};

export function checkoutBaseForPlan(plan) {
  if (plan === "pro") return String(process.env.LEMON_PRO_CHECKOUT_URL || "").trim();
  if (plan === "team") return String(process.env.LEMON_TEAM_CHECKOUT_URL || "").trim();
  return "";
}

export function buildCheckoutUrl(base, user, plan) {
  if (!base) return "";
  const url = new URL(base);
  url.searchParams.set("checkout[custom][user_id]", String(user._id || user.id));
  url.searchParams.set("checkout[custom][plan]", plan);
  if (user.email) url.searchParams.set("checkout[email]", String(user.email));
  if (user.name) url.searchParams.set("checkout[name]", String(user.name));
  return url.toString();
}

export function verifyLemonSignature(rawBody, signature) {
  const secret = String(process.env.LEMON_WEBHOOK_SECRET || "");
  if (!secret || !rawBody || !signature) return false;
  const expected = Buffer.from(
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex"),
    "utf8"
  );
  const received = Buffer.from(String(signature), "utf8");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export function planFromWebhook(payload) {
  const customPlan = String(payload?.meta?.custom_data?.plan || "").toLowerCase();
  if (customPlan === "pro" || customPlan === "team") return customPlan;

  const variantId = String(payload?.data?.attributes?.variant_id || "");
  const proVariant = String(process.env.LEMON_PRO_VARIANT_ID || "");
  const teamVariant = String(process.env.LEMON_TEAM_VARIANT_ID || "");
  if (proVariant && variantId === proVariant) return "pro";
  if (teamVariant && variantId === teamVariant) return "team";
  return "free";
}

export function hasPaidAccess(status, endsAt) {
  const normalized = String(status || "").toLowerCase();
  if (["active", "on_trial"].includes(normalized)) return true;
  if (normalized === "cancelled" && endsAt) {
    const end = new Date(endsAt).getTime();
    return Number.isFinite(end) && end > Date.now();
  }
  return false;
}

export async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

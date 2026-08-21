import { dbConnect } from "./mongodb.js";
import AnalyticsEvent from "../models/AnalyticsEvent.js";

function clean(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function safeMeta(meta) {
  try {
    const raw = JSON.stringify(meta && typeof meta === "object" ? meta : {});
    if (!raw) return {};
    return JSON.parse(raw.slice(0, 4000));
  } catch {
    return {};
  }
}

export function deviceFromRequest(req) {
  const ua = String(req?.headers?.["user-agent"] || "").toLowerCase();
  if (!ua) return "unknown";
  if (/bot|crawler|spider|slurp|headless|preview/.test(ua)) return "bot";
  if (/ipad|tablet|kindle|silk/.test(ua)) return "tablet";
  if (/mobile|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}

export function countryFromRequest(req) {
  return clean(req?.headers?.["x-vercel-ip-country"] || req?.headers?.["cf-ipcountry"] || "", 12).toUpperCase();
}

export async function recordAnalytics(event, data = {}) {
  try {
    await dbConnect();
    const device = data.device || deviceFromRequest(data.req);
    return await AnalyticsEvent.create({
      event: clean(event, 64),
      path: clean(data.path, 500),
      sessionId: clean(data.sessionId, 120),
      brainUser: data.brainUser || null,
      source: clean(data.source, 160),
      referrer: clean(data.referrer, 500),
      country: clean(data.country || countryFromRequest(data.req), 12).toUpperCase(),
      device: ["desktop", "mobile", "tablet", "bot", "unknown"].includes(device) ? device : "unknown",
      meta: safeMeta(data.meta),
    });
  } catch (error) {
    console.warn("Ashes analytics write skipped:", error?.message || error);
    return null;
  }
}

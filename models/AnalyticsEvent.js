import mongoose from "mongoose";

const AnalyticsEventSchema = new mongoose.Schema(
  {
    event: { type: String, required: true, trim: true, maxlength: 64, index: true },
    path: { type: String, default: "", trim: true, maxlength: 500 },
    sessionId: { type: String, default: "", trim: true, maxlength: 120, index: true },
    brainUser: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOSUser", default: null, index: true },
    source: { type: String, default: "", trim: true, maxlength: 160 },
    referrer: { type: String, default: "", trim: true, maxlength: 500 },
    country: { type: String, default: "", trim: true, maxlength: 12 },
    device: { type: String, enum: ["desktop", "mobile", "tablet", "bot", "unknown"], default: "unknown" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

AnalyticsEventSchema.index({ event: 1, createdAt: -1 });
AnalyticsEventSchema.index({ path: 1, createdAt: -1 });
AnalyticsEventSchema.index({ brainUser: 1, createdAt: -1 });

export default mongoose.models.AnalyticsEvent || mongoose.model("AnalyticsEvent", AnalyticsEventSchema);

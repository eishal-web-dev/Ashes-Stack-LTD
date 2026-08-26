import mongoose from "mongoose";

const WorkOSUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "", trim: true, maxlength: 1000 },
    plan: { type: String, enum: ["free", "pro", "team"], default: "free", index: true },
    billing: {
      provider: { type: String, default: "lemonsqueezy" },
      subscriptionId: { type: String, default: "" },
      customerId: { type: String, default: "" },
      variantId: { type: String, default: "" },
      status: { type: String, default: "" },
      renewsAt: { type: Date, default: null },
      endsAt: { type: Date, default: null },
      portalUrl: { type: String, default: "" },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.models.WorkOSUser || mongoose.model("WorkOSUser", WorkOSUserSchema);

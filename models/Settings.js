import mongoose from "mongoose";

// Singleton document for business-wide settings (cash on hand, etc.)
const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "main" },
    cashOnHand: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);

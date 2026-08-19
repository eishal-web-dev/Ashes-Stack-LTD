import mongoose from "mongoose";

// Singleton document for business-wide settings.
// cashOnHand here is a STARTING BALANCE, set once as a baseline — the
// actual current cash figure shown in the app is auto-computed as
// startingBalance + total revenue earned − total costs paid, so it
// updates itself automatically as invoices get paid and bills get paid,
// instead of needing manual updates every time.
const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "main" },
    cashOnHand: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);

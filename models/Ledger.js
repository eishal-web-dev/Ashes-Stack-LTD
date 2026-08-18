import mongoose from "mongoose";

// Tracks money out: operating expenses, marketing/ad spend, and bills you owe (payables).
const LedgerSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ["expense", "marketing", "payable"], required: true },
    amount: { type: Number, required: true },
    note: { type: String },
    date: { type: Date, default: Date.now },
    paid: { type: Boolean, default: true }, // only meaningful for category:'payable' — false = still owed
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.Ledger || mongoose.model("Ledger", LedgerSchema);

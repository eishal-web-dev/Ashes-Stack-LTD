import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g. account_created, document_sent, document_downloaded, document_signed, payment_marked_paid
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who did it (admin or the client themselves)
  },
  { timestamps: true }
);

export default mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);

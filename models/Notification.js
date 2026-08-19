import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true }, // e.g. document_sent, account_created
    title: { type: String, required: true },
    message: { type: String },
    read: { type: Boolean, default: false },
    link: { type: String }, // where clicking it should take you, e.g. /portal
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

import mongoose from "mongoose";
import Notification from "./Notification.js";

const DocRecordSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["welcome","contract","invoice","access_request","monthly_report","fulfillment","feedback_request","custom_file","appointment_letter"], required: true },
    title: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    pdfBase64: { type: String, required: true },
    mimeType: { type: String, default: "application/pdf" },
    fileName: { type: String },
    status: { type: String, enum: ["sent", "downloaded"], default: "sent" },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    paidAt: { type: Date },
    signedAt: { type: Date },
    signedByName: { type: String },
  },
  { timestamps: true }
);

DocRecordSchema.pre("save", function(next) {
  this.$locals.wasNew = this.isNew;
  next();
});

DocRecordSchema.post("save", async function(doc) {
  if (!doc.$locals.wasNew) return;
  try {
    const isAppointment = doc.type === "appointment_letter";
    await Notification.create({
      user: doc.client,
      title: isAppointment ? "Appointment letter received" : "New document from Ashes",
      message: `${doc.title} is ready to view.`,
      kind: isAppointment ? "appointment" : "document",
      href: isAppointment ? "/team#documents" : "/portal#documents",
      meta: { documentId: doc._id, type: doc.type, title: doc.title },
    });
  } catch (e) {
    console.error("document notification failed:", e.message);
  }
});

export default mongoose.models.DocRecord || mongoose.model("DocRecord", DocRecordSchema);

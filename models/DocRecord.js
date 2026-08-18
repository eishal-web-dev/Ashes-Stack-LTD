import mongoose from "mongoose";
import Notification from "./Notification.js";
import { documentStoragePath, storageConfigured, uploadBuffer } from "../lib/supabaseStorage.js";

const DocRecordSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["welcome","contract","invoice","access_request","monthly_report","fulfillment","feedback_request","custom_file","appointment_letter"], required: true },
    title: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    pdfBase64: { type: String },
    storageProvider: { type: String, enum: ["mongodb", "supabase"], default: "mongodb" },
    storagePath: { type: String, index: true },
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

DocRecordSchema.pre("save", async function(next) {
  try {
    this.$locals.wasNew = this.isNew;
    if (this.isNew && this.pdfBase64 && !this.storagePath && storageConfigured()) {
      const path = documentStoragePath(this);
      const buffer = Buffer.from(this.pdfBase64, "base64");
      await uploadBuffer(path, buffer, this.mimeType || "application/octet-stream");
      this.storageProvider = "supabase";
      this.storagePath = path;
      this.pdfBase64 = undefined;
    }
    next();
  } catch (error) {
    next(error);
  }
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

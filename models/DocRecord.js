import mongoose from "mongoose";

const DocRecordSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "welcome",
        "contract",
        "invoice",
        "access_request",
        "monthly_report",
        "fulfillment",
        "feedback_request",
        "offer_letter",
        "custom_file",
      ],
      required: true,
    },
    title: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g. invoice items/amount
    pdfBase64: { type: String, required: true }, // holds base64 content for any file type, not just PDFs
    mimeType: { type: String, default: "application/pdf" },
    fileName: { type: String },
    status: { type: String, enum: ["sent", "downloaded"], default: "sent" },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Invoice payment tracking
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    paidAt: { type: Date },

    // Contract e-signature
    signedAt: { type: Date },
    signedByName: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.DocRecord || mongoose.model("DocRecord", DocRecordSchema);

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
      ],
      required: true,
    },
    title: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g. invoice items/amount
    pdfBase64: { type: String, required: true },
    status: { type: String, enum: ["sent", "downloaded"], default: "sent" },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.DocRecord || mongoose.model("DocRecord", DocRecordSchema);

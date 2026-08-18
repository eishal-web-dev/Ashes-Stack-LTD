import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    clientName: { type: String, required: true },
    company: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 800 },
  },
  { timestamps: true }
);

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);

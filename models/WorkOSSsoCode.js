import mongoose from "mongoose";

const WorkOSSsoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, default: "" },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["admin", "team", "client", "user"], default: "user" },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export default mongoose.models.WorkOSSsoCode || mongoose.model("WorkOSSsoCode", WorkOSSsoCodeSchema);

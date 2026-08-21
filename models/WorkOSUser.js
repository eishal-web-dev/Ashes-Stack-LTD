import mongoose from "mongoose";

const WorkOSUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.WorkOSUser || mongoose.model("WorkOSUser", WorkOSUserSchema);

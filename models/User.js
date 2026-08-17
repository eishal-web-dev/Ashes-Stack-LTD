import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["client", "admin"], default: "client" },

    // Basic client profile data
    age: { type: Number },
    gender: { type: String },
    googleEmail: { type: String }, // used for Google Meet invites
    phone: { type: String },
    project: { type: String, default: "Landing Page Service Agreement" },
    company: { type: String, default: "Life Time Car Wash" },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["client", "admin", "team"], default: "client" },

    // Basic client profile data
    age: { type: Number },
    gender: { type: String },
    googleEmail: { type: String }, // used for Google Meet invites
    phone: { type: String },
    project: { type: String, default: "Landing Page Service Agreement" },
    company: { type: String, default: "Life Time Car Wash" },
    notes: { type: String },

    // Sales pipeline / mini-CRM
    stage: {
      type: String,
      enum: ["lead", "contacted", "demo", "proposal", "won", "in_progress", "delivered", "paid", "review", "repeat_client", "lost"],
      default: "lead",
    },
    source: {
      type: String,
      enum: ["whatsapp", "linkedin", "instagram", "fiverr", "referral", "other"],
      default: "other",
    },
    dealValue: { type: Number }, // estimated/agreed value of this client's deal, for pipeline value calc
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);

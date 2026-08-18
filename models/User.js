import mongoose from "mongoose";

const TeamTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["todo", "in_progress", "done"], default: "todo" },
    dueDate: { type: Date },
  },
  { _id: true, timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["client", "admin", "team"], default: "client" },

    // Shared profile data
    age: { type: Number },
    gender: { type: String },
    googleEmail: { type: String },
    phone: { type: String },
    project: { type: String, default: "Landing Page Service Agreement" },
    company: { type: String, default: "Life Time Car Wash" },
    notes: { type: String },

    // Team-only HR data. Team accounts never receive CRM/finance permissions.
    teamTitle: { type: String, default: "Team Member" },
    department: { type: String, default: "Delivery" },
    availability: { type: String, default: "Available" },
    employmentStatus: { type: String, default: "Active" },
    startedAt: { type: Date },
    salaryAmount: { type: Number },
    salaryCurrency: { type: String, default: "PKR" },
    salaryFrequency: { type: String, enum: ["monthly", "weekly", "hourly", "project"], default: "monthly" },
    appointmentLetterTitle: { type: String, default: "Appointment Letter" },
    appointmentLetterUrl: { type: String },
    teamTasks: { type: [TeamTaskSchema], default: [] },

    // Sales pipeline / mini-CRM. Used for client accounts only.
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
    dealValue: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);

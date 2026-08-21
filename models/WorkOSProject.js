import mongoose from "mongoose";

const MemorySchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 12000 },
    source: { type: String, default: "Ashes", trim: true, maxlength: 80 },
    kind: { type: String, enum: ["memory", "conversation", "decision", "handoff"], default: "memory" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const WorkOSProjectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    goal: { type: String, default: "", trim: true, maxlength: 4000 },
    memory: { type: [MemorySchema], default: [] },
  },
  { timestamps: true }
);

WorkOSProjectSchema.index({ owner: 1, clientId: 1 }, { unique: true });

export default mongoose.models.WorkOSProject || mongoose.model("WorkOSProject", WorkOSProjectSchema);

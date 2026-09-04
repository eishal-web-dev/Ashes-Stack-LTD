import mongoose from "mongoose";

const RoboLabProjectSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, default: "Untitled Project", trim: true, maxlength: 180 },
    description: { type: String, default: "", maxlength: 4000 },
    thumbnailUrl: { type: String, default: "", maxlength: 2000 },
    tags: { type: [String], default: [] },
    circuitData: { type: mongoose.Schema.Types.Mixed, default: {} },
    codeData: { type: String, default: "", maxlength: 250000 },
    worldData: { type: mongoose.Schema.Types.Mixed, default: {} },
    isPublic: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

RoboLabProjectSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.models.RoboLabProject || mongoose.model("RoboLabProject", RoboLabProjectSchema);

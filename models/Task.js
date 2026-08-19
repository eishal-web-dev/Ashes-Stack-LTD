import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // the team member
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // the admin who assigned it
    relatedClient: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional, if the task is about a specific client
    status: { type: String, enum: ["todo", "in_progress", "done"], default: "todo" },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);

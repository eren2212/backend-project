const mongoose = require("mongoose");
const Enum = require("../../config/Enum");

const schema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(Enum.TASK_STATUS),
      default: Enum.TASK_STATUS.PENDING,
    },
    priority: {
      type: String,
      enum: Object.values(Enum.TASK_PRIORITY),
      default: Enum.TASK_PRIORITY.MEDIUM,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "projects",
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    is_active: { type: Boolean, default: true },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

class Tasks extends mongoose.Model {}

schema.loadClass(Tasks);

module.exports = mongoose.model("tasks", schema);

const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

class Projects extends mongoose.Model {}

schema.loadClass(Projects);

module.exports = mongoose.model("projects", schema);

const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "targetModel",
      required: true
    },
    targetModel: {
      type: String,
      required: true,
      enum: ["Post"]
    },
    reason: {
      type: String,
      required: true,
      enum: ["Spam", "Harassment", "Inappropriate", "Illegal", "Intellectual Property", "Other"]
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "ignored"],
      default: "pending"
    },
    actionTaken: {
      type: String,
      enum: ["none", "deleted", "ignored"],
      default: "none"
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

reportSchema.index({ targetId: 1, reporter: 1 });
reportSchema.index({ status: 1 });

module.exports = mongoose.model("Report", reportSchema);

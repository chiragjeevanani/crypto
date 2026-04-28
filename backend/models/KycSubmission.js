const mongoose = require("mongoose");

const kycSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    aadharNumber: {
      type: String,
      required: true
    },
    panNumber: {
      type: String,
      required: true
    },
    documents: {
      aadharFrontUrl: String,
      aadharBackUrl: String,
      panCardUrl: String
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true
    },
    rejectionReason: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("KycSubmission", kycSubmissionSchema);

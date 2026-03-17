const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    coins: {
      type: Number,
      required: true,
      min: 0
    },
    coinRate: {
      type: Number,
      required: true,
      min: 0
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 0
    },
    platformFee: {
      type: Number,
      required: true,
      min: 0
    },
    gst: {
      type: Number,
      required: true,
      min: 0
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["pending", "success", "rejected"],
      default: "pending",
      index: true
    },
    rejectionReason: {
      type: String,
      default: ""
    },
    idempotencyKey: {
      type: String,
      default: null
    },
    processedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

withdrawalSchema.index({ userId: 1, createdAt: -1 });
withdrawalSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);

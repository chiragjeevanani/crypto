const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["deposit", "gift_sent", "gift_received", "withdrawal"],
      required: true
    },
    coins: {
      type: Number,
      required: true,
      min: 0
    },
    amount: {
      type: Number,
      default: null
    },
    beforeBalance: {
      type: Number,
      required: true,
      min: 0
    },
    afterBalance: {
      type: Number,
      required: true,
      min: 0
    },
    referenceId: {
      type: String,
      default: ""
    },
    referenceType: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success"
    },
    idempotencyKey: {
      type: String,
      default: null
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index(
  { userId: 1, type: 1, idempotencyKey: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);

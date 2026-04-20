const mongoose = require("mongoose");

const adminNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["nft_promotion", "withdrawal_request", "report", "system", "auction"]
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

// Auto-delete after 60 days to keep db clean
adminNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

module.exports = mongoose.model("AdminNotification", adminNotificationSchema);

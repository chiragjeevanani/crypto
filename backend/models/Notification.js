const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow null for global announcements
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    isGlobal: {
      type: Boolean,
      default: false,
      index: true
    },
    // gift | follow | recommendation | system | premium_gift | follower_broadcast | mention | tag
    type: {
      type: String,
      required: true,
      enum: ["gift", "follow", "recommendation", "system", "premium_gift", "follower_broadcast", "mention", "tag"]
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    subtitle: {
      type: String,
      default: "",
      trim: true
    },
    meta: {
      type: Object,
      default: {}
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Auto-delete notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Fast lookup for unread count
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

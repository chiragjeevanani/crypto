const mongoose = require("mongoose");

const savedPostSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    type: { type: String, enum: ["post", "reel"], required: true },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate saves and ensure fast lookups
savedPostSchema.index({ userId: 1, postId: 1 }, { unique: true });
savedPostSchema.index({ userId: 1, savedAt: -1 });

module.exports = mongoose.model("SavedPost", savedPostSchema);

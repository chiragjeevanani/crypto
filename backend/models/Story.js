const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    media: {
      type: {
        type: String,
        enum: ["image", "video"],
        default: "image"
      },
      url: { type: String, required: true }
    },
    caption: {
      type: String,
      trim: true,
      default: ""
    },
    captionStyle: {
      x: { type: Number, default: 0.5 }, // 0-1 horizontal position (0 = left, 1 = right)
      y: { type: Number, default: 0.8 }, // 0-1 vertical position (0 = top, 1 = bottom)
      textColor: { type: String, default: "#ffffff" },
      backgroundColor: { type: String, default: "#000000" }
    },
    musicTrackId: {
      type: String,
      trim: true,
      default: "none"
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Story", storySchema);


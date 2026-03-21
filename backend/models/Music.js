const mongoose = require("mongoose");

const musicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    artist: {
      type: String,
      required: true,
      trim: true
    },
    audioUrl: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      default: 0
    },
    thumbnail: {
      type: String,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

musicSchema.index({ title: "text", artist: "text" });
musicSchema.index({ isActive: 1 });

module.exports = mongoose.model("Music", musicSchema);

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    roomId: {
      type: String,
      required: true,
      index: true
    },
    text: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ["text", "post", "reel", "image", "file"],
      default: "text"
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);

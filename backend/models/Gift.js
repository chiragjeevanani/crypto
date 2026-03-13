const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    icon: {
      type: String,
      trim: true,
      default: "🎁"
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Deleted"],
      default: "Active"
    },
    usage: {
      type: Number,
      default: 0
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gift", giftSchema);


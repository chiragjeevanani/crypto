const mongoose = require("mongoose");

const marketingDealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      default: 0
    },
    media: {
      url: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ["image", "video"],
        default: "video"
      }
    },
    link: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MarketingDeal", marketingDealSchema);

const mongoose = require("mongoose");

const nftOfferSchema = new mongoose.Schema(
  {
    collectibleId: {
      type: String,
      required: true,
      index: true,
    },
    bidderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offerAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// A bidder can only have one active pending offer per collectible
nftOfferSchema.index({ collectibleId: 1, bidderId: 1, status: 1 });

module.exports = mongoose.model("NFTOffer", nftOfferSchema);

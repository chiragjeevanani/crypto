const mongoose = require("mongoose");

/**
 * CollectibleOwnership
 * Web2 replacement for NFTOwnership.
 * Tracks full ownership history of every KnQ Digital Collectible.
 * A new record is created each time a collectible is sold/transferred.
 */
const collectibleOwnershipSchema = new mongoose.Schema(
  {
    // Link back to the original auction
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction"
    },
    // Link back to the original post if it was a post NFT
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      index: true
    },
    // Platform-issued unique identifier (e.g. KNQ-2026-0001)
    collectibleId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    // Previous owner (null for initial sale from creator)
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    // New owner
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    // Sale price in platform coins
    salePrice: {
      type: Number,
      default: 0
    },
    // Transfer type
    transferType: {
      type: String,
      enum: ["initial_sale", "resale"],
      default: "initial_sale"
    },
    // Platform-generated ownership certificate (Cloudinary URL)
    certificateUrl: {
      type: String,
      default: ""
    },
    // True if the current owner listed it for fixed-price resale
    isListedForSale: {
      type: Boolean,
      default: false
    },
    // The fixed price if listed for sale
    resalePrice: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

collectibleOwnershipSchema.index({ toUserId: 1, createdAt: -1 });
collectibleOwnershipSchema.index({ auctionId: 1 });

module.exports = mongoose.model("CollectibleOwnership", collectibleOwnershipSchema);

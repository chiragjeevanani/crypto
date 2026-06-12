const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    mediaUrl: {
      type: String,
      required: true
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "audio"],
      default: "image"
    },
    proofVideoUrl: {
      type: String,
      default: ""
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "rejected", "live", "ended"],
      default: "pending"
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    highestBid: {
      type: Number,
      default: 0
    },
    listingFeePaid: {
      type: Boolean,
      default: false
    },
    paymentOrderId: {
      type: String,
      default: ""
    },
    commissionPct: {
      type: Number,
      default: 0
    },
    gstPct: {
      type: Number,
      default: 0
    },

    // ─── Collectible (Web2) Status ────────────────────────────────────────────
    // Tracks whether the auction's collectible has been claimed by the winner
    nftStatus: {
      type: String,
      enum: ["none", "pending", "settled"],
      default: "none"
    },
    // Cloudinary public_id for the collectible media (for certificate generation)
    mediaPublicId: { type: String, default: "" },
    // URL to a platform-generated ownership certificate (Cloudinary image)
    ownershipCertUrl: { type: String, default: "" },
    // Creator royalty percentage on resales (tracked in DB, not on-chain)
    royaltyPct: { type: Number, default: 10, min: 0, max: 30 }

  },
  { timestamps: true }
);

auctionSchema.index({ status: 1, startDate: 1, endDate: 1 });
auctionSchema.index({ creator: 1 });

module.exports = mongoose.model("Auction", auctionSchema);

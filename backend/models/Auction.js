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

    // ─── Web3 / NFT Fields (additive — all have safe defaults) ────────────────
    // NFT lifecycle: none → pending_ipfs → ipfs_ready → minting → minted | deposit_received | settling | settled | failed | failed_settle
    nftStatus: {
      type: String,
      enum: ["none", "pending_ipfs", "ipfs_ready", "minting", "minted", "deposit_received", "settling", "settled", "failed", "failed_settle"],
      default: "none"
    },
    // IPFS URIs (ipfs://Qm...)
    ipfsFileUri: { type: String, default: "" },      // media file on IPFS
    ipfsMetadataUri: { type: String, default: "" },  // metadata JSON on IPFS
    // On-chain data (populated after mint/settle)
    tokenId: { type: Number, default: null },
    contractAddress: { type: String, default: "" },
    mintTxHash: { type: String, default: "" },
    vaultDepositTxHash: { type: String, default: "" },
    settlementTxHash: { type: String, default: "" },
    // Wallet addresses
    winnerWalletAddress: { type: String, default: "" },  // buyer's wallet
    creatorWalletAddress: { type: String, default: "" }, // creator's wallet for royalties
    // Royalty percentage (default 10%)
    royaltyPct: { type: Number, default: 10, min: 0, max: 30 }
  },
  { timestamps: true }
);

auctionSchema.index({ status: 1, startDate: 1, endDate: 1 });
auctionSchema.index({ creator: 1 });

module.exports = mongoose.model("Auction", auctionSchema);

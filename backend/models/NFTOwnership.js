const mongoose = require("mongoose");

/**
 * NFTOwnership
 * Tracks the full ownership history of every KnQ NFT.
 * A new record is created each time an NFT changes hands
 * (initial mint OR secondary sale — detected via Alchemy webhook).
 */
const nftOwnershipSchema = new mongoose.Schema(
  {
    // Link back to the original auction
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      index: true
    },
    // On-chain identifiers
    tokenId: {
      type: Number,
      required: true,
      index: true
    },
    contractAddress: {
      type: String,
      required: true,
      lowercase: true
    },
    // Wallet addresses
    fromAddress: {
      type: String,
      default: "",    // empty string for initial mint (from zero address)
      lowercase: true
    },
    toAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    // Platform user IDs (may be null if sale happened on OpenSea by unknown user)
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    // Sale info
    salePrice: {
      type: Number,
      default: 0     // in MATIC (wei / 1e18)
    },
    salePriceUSD: {
      type: Number,
      default: 0     // USD equivalent at time of sale
    },
    // Blockchain data
    txHash: {
      type: String,
      required: true,
      unique: true
    },
    // Where the transfer happened
    platform: {
      type: String,
      enum: ["knq", "opensea", "blur", "rarible", "other"],
      default: "knq"
    },
    // Transfer type
    transferType: {
      type: String,
      enum: ["mint", "sale", "transfer"],
      default: "mint"
    }
  },
  { timestamps: true }
);

nftOwnershipSchema.index({ tokenId: 1, contractAddress: 1 });
nftOwnershipSchema.index({ toAddress: 1, createdAt: -1 });

module.exports = mongoose.model("NFTOwnership", nftOwnershipSchema);

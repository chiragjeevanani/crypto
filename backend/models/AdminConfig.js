const mongoose = require("mongoose");

const adminConfigSchema = new mongoose.Schema(
  {
    coinRate: {
      type: Number,
      default: 10,
      min: 0
    },
    platformFeePct: {
      type: Number,
      default: 10,
      min: 0
    },
    gstPct: {
      type: Number,
      default: 18,
      min: 0
    },
    minReferralsForWithdrawal: {
      type: Number,
      default: 5,
      min: 0
    },
    minWithdrawalCoins: {
      type: Number,
      default: 10, // 10 RS
      min: 0
    },
    premiumThreshold: {
      type: Number,
      default: 100, // 100 RS
      min: 0
    },
    businessPostPriceINR: {
      type: Number,
      default: 499,
      min: 0
    },
    auctionListingFeeINR: {
      type: Number,
      default: 500,
      min: 0
    },
    auctionCommissionPct: {
      type: Number,
      default: 10,
      min: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminConfig", adminConfigSchema);

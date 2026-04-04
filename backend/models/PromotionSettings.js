const mongoose = require("mongoose");

const promotionSettingsSchema = new mongoose.Schema(
  {
    minDailyBudget: { type: Number, default: 99 },
    maxDailyBudget: { type: Number, default: 100000 },
    minDuration: { type: Number, default: 1 },
    maxDuration: { type: Number, default: 30 },
    // Estimated impressions per ₹1 daily budget
    minImpressionFactor: { type: Number, default: 14 }, // e.g. 1.4K for ₹99 -> ~14 per ₹
    maxImpressionFactor: { type: Number, default: 29 }, // e.g. 2.9K for ₹99 -> ~29 per ₹
    isActive: { type: Boolean, default: true },
    lastUpdatedBy: { type: String, default: "System" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PromotionSettings", promotionSettingsSchema);

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
    referralBonusCoins: {
      type: Number,
      default: 100,
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
    },
    adminNotificationMobiles: {
      type: [String],
      default: [],
      validate: [
        (val) => val.length <= 4,
        "Cannot exceed 4 mobile numbers"
      ]
    },
    nftTermsAndConditions: {
      type: String,
      default: "By submitting your NFT to this platform, you confirm that:\n\n1. You are the original creator and rightful owner of this digital asset.\n2. The content does not violate any intellectual property rights.\n3. The content is not obscene, harmful, or illegal.\n4. Your submission will be reviewed by admin before going live.\n5. The platform reserves the right to reject any submission without a refund of any fees.\n6. Once approved, your NFT will be visible in the marketplace."
    },
    termsAndConditions: {
      type: String,
      default: "These are the default terms and conditions. Please update them in the admin panel."
    },
    privacyPolicy: {
      type: String,
      default: "This is the default privacy policy. Please update it in the admin panel."
    },
    supportEmail: {
      type: String,
      default: "support@example.com"
    },
    supportMobile: {
      type: String,
      default: ""
    },
    faqs: {
      type: [
        {
          question: { type: String, required: true },
          answer: { type: String, required: true }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminConfig", adminConfigSchema);

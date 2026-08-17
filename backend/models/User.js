const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["User", "SuperNode", "Admin", "super_admin", "Developer"],
      default: "User"
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    bio: {
      type: String,
      trim: true,
      default: ""
    },
    avatar: {
      type: String,
      trim: true,
      default: ""
    },
    handle: {
      type: String,
      trim: true,
      default: ""
    },
    countryCode: {
      type: String,
      trim: true,
      default: ""
    },
    countryName: {
      type: String,
      trim: true,
      default: ""
    },
    currencyCode: {
      type: String,
      trim: true,
      default: "INR"
    },
    currencySymbol: {
      type: String,
      trim: true,
      default: "₹"
    },
    rechargeCoins: {
      type: Number,
      default: 0,
      min: 0
    },
    earningCoins: {
      type: Number,
      default: 0,
      min: 0
    },
    isMonetized: {
      type: Boolean,
      default: false
    },
    referralCount: {
      type: Number,
      default: 0
    },
    kycStatus: {
      type: String,
      enum: ["unsubmitted", "pending", "verified", "rejected"],
      default: "unsubmitted"
    },
    referralCode: {
      type: String,
      unique: true,
      trim: true,
      default: null
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    // Social graph
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dismissedSuggestions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isBanned: {
      type: Boolean,
      default: false
    },
    isSuspicious: {
      type: Boolean,
      default: false
    },
    state: {
      type: String,
      trim: true,
      default: ""
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: ""
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    language: {
      type: String,
      trim: true,
      default: "English"
    },
    languages: {
      type: [String],
      default: []
    },
    hasSelectedLanguages: {
      type: Boolean,
      default: false
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    agreedToTerms: {
      type: Boolean,
      default: false
    },
    resetPasswordOtp: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationOtp: {
      type: String,
      default: null
    },
    emailVerificationExpires: {
      type: Date,
      default: null
    },
    fcmTokens: [{ type: String }],
    // ─── Payout Methods ───────────────────────────────────────────────────
    payoutMethods: [{
      type: { type: String, enum: ['bank', 'upi'] },
      upiId: String,
      holderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      primary: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    media: {
      type: {
        type: String,
        enum: ["image", "video", "audio"],
        default: "image"
      },
      url: { type: String, required: true },
      aspectRatio: { type: String, default: "4/3" }
    },
    caption: { type: String, trim: true, default: "" },
    language: { type: String, trim: true, default: "English" },
    category: { type: String, trim: true, default: "General" },
    subcategory: { type: String, trim: true, default: "" },
    filter: { type: String, trim: true, default: "none" },
    musicTrackId: { type: String, trim: true, default: "none" },
    isNFT: { type: Boolean, default: false },
    nftPriceINR: { type: Number, default: 0 },
    totalCopies: { type: Number, default: 1 },
    copiesSold: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged", "sold"],
      default: "pending"
    },
    rejectReason: { type: String, default: "" },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likes: { type: Number, default: 0 },
    sharedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    earnings: { type: Number, default: 0 },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", default: null },
    campaignSubmission: { type: mongoose.Schema.Types.ObjectId, ref: "CampaignSubmission", default: null },
    // Business content extensions
    isBusiness: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },
    ctaType: {
      type: String,
      enum: ["Shop Now", "Order Now", "Contact Us", "none"],
      default: "none"
    },
    redirectType: {
      type: String,
      enum: ["whatsapp", "internal", "none"],
      default: "none"
    },
    whatsappNumber: { type: String, trim: true, default: "" },
    externalLink: { type: String, trim: true, default: "" },
    isPublished: { type: Boolean, default: false },
    isAdminViewed: { type: Boolean, default: false },
    promotion: {
      isEnabled: { type: Boolean, default: false },
      dailyBudget: { type: Number, default: 0 },
      duration: { type: Number, default: 0 }, // 0 = run until pause
      totalBudget: { type: Number, default: 0 },
      startDate: { type: Date },
      endDate: { type: Date },
      status: { type: String, enum: ["active", "paused", "completed", "none"], default: "none" },
      estimatedImpressions: { type: String, default: "" }
    },
    musicId: { type: mongoose.Schema.Types.ObjectId, ref: "Music", default: null },
    musicStartTime: { type: Number, default: 0 },
    music: {
      id: { type: String, default: "" },
      title: { type: String, default: "" },
      artist: { type: String, default: "" },
      image: { type: String, default: "" },
      preview: { type: String, default: "" },
      startTime: { type: Number, default: 0 }
    },
    history: [
      {
        date: { type: Date, default: Date.now },
        action: { type: String, required: true },
        admin: { type: String, default: "System" }
      }
    ]
  },
  { timestamps: true }
);

postSchema.index({ creator: 1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ isNFT: 1, status: 1 });
postSchema.index({ isBusiness: 1, status: 1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);

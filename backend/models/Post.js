const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
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
    category: { type: String, trim: true, default: "General" },
    filter: { type: String, trim: true, default: "none" },
    musicTrackId: { type: String, trim: true, default: "none" },
    isNFT: { type: Boolean, default: false },
    nftPriceINR: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged"],
      default: "pending"
    },
    rejectReason: { type: String, default: "" },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likes: { type: Number, default: 0 },
    sharedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", default: null },
    campaignSubmission: { type: mongoose.Schema.Types.ObjectId, ref: "CampaignSubmission", default: null }
  },
  { timestamps: true }
);

postSchema.index({ creator: 1, createdAt: -1 });
postSchema.index({ status: 1 });

module.exports = mongoose.model("Post", postSchema);

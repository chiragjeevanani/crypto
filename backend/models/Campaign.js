const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    instructions: { type: String, trim: true, default: "" },
    reward: { type: Number, default: 0 },
    rewardType: { type: String, trim: true, default: "points" },
    participantLimit: { type: Number, default: null },
    completionProof: { type: String, trim: true, default: "text" }
  },
  { _id: false }
);

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    bannerUrl: { type: String, required: true, trim: true },
    bannerType: { type: String, default: "image", trim: true },
    brandName: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    participationType: { type: String, default: "free", trim: true },
    taskInstructions: { type: String, required: true, trim: true },
    rewardDetails: { type: String, required: true, trim: true },
    numberOfWinners: { type: Number, default: 1 },
    votingEnabled: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["Draft", "Active", "Completed", "Expired", "Paused"],
      default: "Draft"
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tasks: { type: [taskSchema], default: [] },
    assets: { type: [Object], default: [] },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    analytics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      joins: { type: Number, default: 0 },
      submissions: { type: Number, default: 0 },
      votes: { type: Number, default: 0 }
    },
    winners: [{ type: mongoose.Schema.Types.ObjectId, ref: "CampaignSubmission" }]
  },
  { timestamps: true }
);

campaignSchema.index({ status: 1, endDate: 1 });
campaignSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model("Campaign", campaignSchema);

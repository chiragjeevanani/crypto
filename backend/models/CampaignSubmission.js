const mongoose = require("mongoose");

const campaignSubmissionSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    media: {
      type: {
        type: String,
        enum: ["image", "video"],
        default: "image"
      },
      url: { type: String, required: true }
    },
    caption: { type: String, trim: true, default: "" },
    votes: { type: Number, default: 0 },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isWinner: { type: Boolean, default: false },
    rewardDistributed: { type: Boolean, default: false },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null }
  },
  { timestamps: true }
);

campaignSubmissionSchema.index({ campaign: 1, createdAt: -1 });
campaignSubmissionSchema.index({ campaign: 1, votes: -1 });
campaignSubmissionSchema.index({ user: 1, campaign: 1 });

module.exports = mongoose.model("CampaignSubmission", campaignSubmissionSchema);

const mongoose = require("mongoose");

const campaignSubmissionSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Public media (the reel/video)
    reel: {
      type: {
        type: String,
        enum: ["image", "video"],
        default: "video"
      },
      url: { type: String, required: true }
    },
    // Verification proof (private to Admin and Uploader)
    billImage: { type: String, default: "" },
    productImage: { type: String, default: "" },
    userSelfie: { type: String, default: "" },

    caption: { type: String, trim: true, default: "" },
    votes: { type: Number, default: 0 },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isWinner: { type: Boolean, default: false },
    rewardDistributed: { type: Boolean, default: false },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

campaignSubmissionSchema.index({ campaign: 1, createdAt: -1 });
campaignSubmissionSchema.index({ campaign: 1, votes: -1 });
campaignSubmissionSchema.index({ user: 1, campaign: 1 });

module.exports = mongoose.model("CampaignSubmission", campaignSubmissionSchema);

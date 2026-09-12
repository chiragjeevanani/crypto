const mongoose = require("mongoose");

/**
 * UserInterestProfile — stores behavior-derived interest scores per user.
 *
 * Scores live in two buckets:
 *  • Long-term  — slowly decaying preferences built across sessions
 *  • Session    — fast-decaying preferences from the current browsing session
 *
 * Both buckets use Map<String, Number> so new admin-created categories,
 * media types, or subcategories are automatically supported without code changes.
 *
 * Key naming:
 *   mediaTypes   → post.media.type  (e.g. "video", "image", "audio")
 *   categories   → post.category    (e.g. "Cricket", "Comedy")
 *   subcategories→ post.subcategory (e.g. "IPL")
 *   languages    → post.language    (e.g. "English", "Hindi")
 *   creators     → post.creator ObjectId as string
 *   combinations → "<mediaType>::<category>"  (e.g. "video::Cricket")
 */
const interestMapSchema = {
  type: Map,
  of: Number,
  default: () => new Map()
};

const userInterestProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    // ── Long-term interest scores (0–100, decays at LONG_TERM_DECAY/day) ──────
    mediaTypes: interestMapSchema,
    categories: interestMapSchema,
    subcategories: interestMapSchema,
    languages: interestMapSchema,
    creators: interestMapSchema,
    /** Combined key: "<mediaType>::<category>" for stronger combined signal */
    combinations: interestMapSchema,

    // ── Session interest (reset or heavily decayed between sessions) ──────────
    sessionMediaTypes: interestMapSchema,
    sessionCategories: interestMapSchema,
    sessionCombinations: interestMapSchema,

    // ── Negative signals ──────────────────────────────────────────────────────
    /** Category names that received explicit negative feedback */
    negativeCategories: interestMapSchema,
    /** Specific posts the user marked "Not Interested" */
    negativePosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    /** Recently seen post IDs — excluded from next feed generation (rolling 500) */
    seenPostIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

    lastUpdated: { type: Date, default: Date.now },
    sessionStartedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Compound index for fast lookup during feed generation
userInterestProfileSchema.index({ userId: 1, lastUpdated: -1 });

module.exports = mongoose.model("UserInterestProfile", userInterestProfileSchema);

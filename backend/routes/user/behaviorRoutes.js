const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authMiddleware");
const Post = require("../../models/Post");
const UserInterestProfile = require("../../models/UserInterestProfile");
const { recordBehaviorEvent } = require("../../services/behaviorEngine");

/**
 * POST /api/user/behavior/event
 *
 * Body: {
 *   postId: string,
 *   eventType: 'watch' | 'like' | 'save' | 'share' | 'comment' | 'skip' | 'not_interested',
 *   watchPct?: number   (0–100, only meaningful when eventType === 'watch')
 * }
 *
 * Fire-and-forget endpoint — returns 200 immediately.
 * The heavy work runs async so it never blocks the UI.
 */
router.post("/event", protect, async (req, res) => {
  // Respond immediately so the frontend never waits
  res.status(200).json({ success: true });

  try {
    const userId = req.user?.userId;
    const { postId, eventType, watchPct } = req.body;

    if (!userId || !postId || !eventType) return;

    // Fetch only the fields needed for scoring — lean for speed
    const post = await Post.findById(postId)
      .select("_id category subcategory language creator media.type")
      .lean();

    if (!post) return;

    await recordBehaviorEvent(userId, post, { type: eventType, watchPct: Number(watchPct || 0) });
  } catch (err) {
    // Non-fatal — log only, never crash the process
    console.error("[BehaviorEngine] event error:", err.message);
  }
});

/**
 * POST /api/user/behavior/not-interested
 *
 * Body: { postId: string }
 *
 * Marks a post as "Not Interested", blocks it from future feeds,
 * and applies a soft negative signal to its category.
 */
router.post("/not-interested", protect, async (req, res) => {
  res.status(200).json({ success: true });

  try {
    const userId = req.user?.userId;
    const { postId } = req.body;

    if (!userId || !postId) return;

    const post = await Post.findById(postId)
      .select("_id category subcategory language creator media.type")
      .lean();

    if (!post) return;

    await recordBehaviorEvent(userId, post, { type: "not_interested" });
  } catch (err) {
    console.error("[BehaviorEngine] not-interested error:", err.message);
  }
});

/**
 * GET /api/user/behavior/profile
 *
 * Returns the current user's interest profile (scores + seen posts count).
 * Useful for debugging and admin inspection.
 */
router.get("/profile", protect, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const profile = await UserInterestProfile.findOne({ userId })
      .select("-seenPostIds -negativePosts -__v")
      .lean();

    if (!profile) {
      return res.status(200).json({
        success: true,
        profile: null,
        message: "No interaction history yet."
      });
    }

    return res.status(200).json({ success: true, profile });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

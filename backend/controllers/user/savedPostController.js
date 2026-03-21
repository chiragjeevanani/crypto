const SavedPost = require("../../models/SavedPost");
const Post = require("../../models/Post");
const { getBaseUrl, formatPostForUserFeed, populateCreator } = require("../../utils/postHelpers");

/**
 * Toggle Save/Unsave for a post
 */
exports.toggleSave = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ success: false, message: "Post ID is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const existingSave = await SavedPost.findOne({ userId, postId });
    if (existingSave) {
      await existingSave.deleteOne();
      return res.status(200).json({ success: true, isSaved: false, message: "Post unsaved" });
    } else {
      const type = post.media?.type === "video" ? "reel" : "post";
      await SavedPost.create({ userId, postId, type });
      return res.status(200).json({ success: true, isSaved: true, message: "Post saved" });
    }
  } catch (error) {
    console.error("Error in toggleSave:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Fetch all saved posts for a user with pagination
 */
exports.getSavedPosts = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const savedDocs = await SavedPost.find({ userId })
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "postId",
        populate: [
          { path: "creator", select: "name handle avatar role followers" },
          { path: "campaign", select: "title brandName bannerUrl rewardDetails" }
        ]
      })
      .lean();

    const baseUrl = getBaseUrl(req);
    const currentUserId = req.user.userId;

    const formattedPosts = savedDocs
      .filter((doc) => doc.postId) // Ensure the post still exists
      .map((doc) => {
        const formatted = formatPostForUserFeed(doc.postId, baseUrl, null, currentUserId);
        return {
          ...formatted,
          savedAt: doc.savedAt,
          saveType: doc.type
        };
      });

    const total = await SavedPost.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      data: formattedPosts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error in getSavedPosts:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lightweight endpoint to get just the IDs of all saved posts for the current user
 */
exports.getSavedPostIds = async (req, res) => {
  try {
    const userId = req.user.userId;
    const savedDocs = await SavedPost.find({ userId }).select("postId").lean();
    const ids = savedDocs.map((doc) => doc.postId.toString());
    return res.status(200).json({ success: true, ids });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

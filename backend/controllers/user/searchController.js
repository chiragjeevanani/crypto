const User = require("../../models/User");
const Post = require("../../models/Post");
const { getBaseUrl, formatPostForUserFeed, avatarUrlFromUser } = require("../../utils/postHelpers");

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.search = async (req, res) => {
  try {
    const raw = req.query.q ?? req.query.query ?? "";
    const q = String(raw || "").trim();
    if (!q) {
      return res.status(200).json({ success: true, query: "", users: [], reels: [] });
    }

    const regex = new RegExp(escapeRegex(q), "i");
    const baseUrl = getBaseUrl(req);

    const users = await User.find({
      role: "User",
      $or: [{ name: regex }, { handle: regex }]
    })
      .select("name handle avatar bio followers")
      .limit(10)
      .lean();

    const userIds = users.map((u) => u._id);
    const posts = await Post.find({
      status: "approved",
      "media.type": "video",
      $or: [{ caption: regex }, { creator: { $in: userIds } }]
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate("creator", "name handle avatar role followers")
      .lean();

    const currentUserId = req.user?.userId?.toString?.();
    const reels = posts.map((post) => formatPostForUserFeed(post, baseUrl, null, currentUserId));

    const mappedUsers = users.map((u) => {
      const rawHandle = u.handle || "";
      const handle = rawHandle
        ? (rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`)
        : `@${(u.name || "user").replace(/\s+/g, "").toLowerCase()}`;
      return {
        id: u._id?.toString?.() || "",
        username: u.name || "User",
        handle,
        avatar: avatarUrlFromUser(u, baseUrl),
        bio: u.bio || "",
        followers: Array.isArray(u.followers) ? u.followers.length : 0
      };
    });

    return res.status(200).json({ success: true, query: q, users: mappedUsers, reels });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const baseUrl = getBaseUrl(req);
    const currentUser = userId ? await User.findById(userId).select("following followers dismissedSuggestions").lean() : null;
    const following = currentUser?.following || [];
    const followers = currentUser?.followers || [];
    const dismissed = currentUser?.dismissedSuggestions || [];

    // Suggestions: Users with role "User", not the current user, not already followed, not following me, and NOT dismissed.
    const query = {
      role: "User",
      _id: { $ne: userId, $nin: [...following, ...followers, ...dismissed] }
    };

    const users = await User.find(query)
      .select("name handle avatar followers")
      .limit(10)
      .lean();

    let finalUsers = users;
    if (finalUsers.length < 3) {
      // Fallback: any 10 users != self AND not already followed/follower
      const fallback = await User.find({
        role: "User",
        _id: { $ne: userId, $nin: [...following, ...followers] }
      })
        .select("name handle avatar followers")
        .limit(10)
        .lean();
      
      // If still not enough, then and only then show anyone else (as a last resort)
      if (fallback.length > 0) {
        finalUsers = fallback;
      }
    }

    const mapped = finalUsers.map((u) => {
      const rawHandle = u.handle || "";
      const handle = rawHandle
        ? (rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`)
        : `@${(u.name || "user").replace(/\s+/g, "").toLowerCase()}`;
      return {
        id: u._id?.toString?.() || "",
        username: u.name || "User",
        handle,
        avatar: avatarUrlFromUser(u, baseUrl),
        followers: Array.isArray(u.followers) ? u.followers.length : 0,
        isFollowing: following.some(f => f.toString() === u._id.toString())
      };
    });

    return res.status(200).json({ success: true, users: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSuggestedReels = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const currentUserId = req.user?.userId?.toString?.();

    // Suggested reels: Recent approved videos.
    // Suggested reels: Recent approved videos or all videos if none are explicitly approved yet (for dev)
    let posts = await Post.find({
      status: "approved",
      "media.type": "video"
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("creator", "name handle avatar role followers")
      .lean();

    if (posts.length === 0) {
      // Fallback to any videos if no approved ones
      posts = await Post.find({
        "media.type": "video"
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("creator", "name handle avatar role followers")
        .lean();
    }

    console.log(`Found ${posts.length} suggested reels for user ${currentUserId}`);
    const reels = posts.map((post) => formatPostForUserFeed(post, baseUrl, null, currentUserId));
    return res.status(200).json({ success: true, reels });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.dismissSuggestedUser = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const targetUserId = req.params.id;
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: "Target User ID is required" });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { dismissedSuggestions: targetUserId }
    });

    return res.status(200).json({ success: true, message: "Suggestion dismissed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

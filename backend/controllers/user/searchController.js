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

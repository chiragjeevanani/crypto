const mongoose = require("mongoose");
const User = require("../../models/User");
const Post = require("../../models/Post");

// Map a User document into the shape expected by the admin UI
function toAdminUserSummary(user, extra = {}) {
  const createdAt =
    user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt || Date.now());
  const joined = createdAt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });

  const followersCount = Array.isArray(user.followers) ? user.followers.length : (extra.followersCount ?? 0);
  return {
    id: user._id.toString(),
    name: user.name || "User",
    email: user.email || "",
    role: user.role === "User" ? "Standard" : user.role || "Standard",
    status: "Pending",
    kycStatus: "pending",
    kycVerified: false,
    riskScore: "Low",
    joined,
    walletBalance: 0,
    totalEarnings: 0,
    campaigns: 0,
    isBanned: false,
    isSuspicious: false,
    referralCode: "",
    referredCount: 0,
    aadharFront: "",
    aadharBack: "",
    avatar: user.avatar || "",
    postsCount: extra.postsCount ?? 0,
    followersCount,
    followingCount: Array.isArray(user.following) ? user.following.length : (extra.followingCount ?? 0)
  };
}

exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = (req.query.search || "").trim();

    const filter = {};
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name email role avatar createdAt followers following")
      .lean()
      .exec();

    const userIds = users.map((u) => u._id.toString());
    const [postCounts, nftCounts] = await Promise.all([
      Post.aggregate([
        { $match: { creator: { $in: users.map((u) => u._id) } } },
        { $group: { _id: "$creator", count: { $sum: 1 } } }
      ]).exec(),
      Post.aggregate([
        { $match: { creator: { $in: users.map((u) => u._id) }, isNFT: true } },
        { $group: { _id: "$creator", count: { $sum: 1 } } }
      ]).exec()
    ]);

    const postsByCreator = {};
    postCounts.forEach((r) => { postsByCreator[r._id.toString()] = r.count; });
    const nftsByCreator = {};
    nftCounts.forEach((r) => { nftsByCreator[r._id.toString()] = r.count; });

    const mapped = users.map((u) => {
      const id = u._id.toString();
      return toAdminUserSummary(u, {
        postsCount: postsByCreator[id] ?? 0,
        followersCount: Array.isArray(u.followers) ? u.followers.length : 0,
        followingCount: Array.isArray(u.following) ? u.following.length : 0
      });
    });

    return res.status(200).json({
      success: true,
      users: mapped,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const userId = req.params.id;
    const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    if (!userObjId) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const user = await User.findById(userId)
      .populate("followers", "name handle avatar _id")
      .populate("following", "name handle avatar _id")
      .lean()
      .exec();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const [postsCount, nftsCount] = await Promise.all([
      Post.countDocuments({ creator: userObjId }).exec(),
      Post.countDocuments({ creator: userObjId, isNFT: true }).exec()
    ]);

    const base = toAdminUserSummary(user);

    const followersList = (user.followers || []).filter(Boolean).map((f) => ({
      id: (f._id || f.id || "").toString(),
      name: f.name || "User",
      handle: f.handle || "",
      avatar: f.avatar || ""
    }));
    const followingList = (user.following || []).filter(Boolean).map((f) => ({
      id: (f._id || f.id || "").toString(),
      name: f.name || "User",
      handle: f.handle || "",
      avatar: f.avatar || ""
    }));

    const detail = {
      ...base,
      kycStatus: base.kycVerified ? "approved" : "pending",
      followersCount: Number(followersList.length),
      followingCount: Number(followingList.length),
      followers: followersList,
      following: followingList,
      postsCount: Number(postsCount),
      nftsCount: Number(nftsCount),
      giftHistory: [
        { id: "G-1", sender: "System", gift: "Welcome Bonus", value: 0, date: base.joined }
      ],
      votingHistory: [],
      campaignParticipation: []
    };

    return res.status(200).json({ success: true, user: detail });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: get followers list for a user by id.
 * "followers" = users who follow this user (this user's followers).
 */
exports.getUserFollowers = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId)
      .populate("followers", "name handle avatar _id")
      .select("followers")
      .lean()
      .exec();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const raw = user.followers || [];
    const followers = raw.filter(Boolean).map((f) => ({
      id: (f._id || f.id || "").toString(),
      name: f.name || "User",
      handle: f.handle || "",
      avatar: f.avatar || ""
    }));
    return res.status(200).json({ success: true, count: followers.length, followers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: get following list for a user by id.
 * "following" = users this user follows (this user's following list).
 */
exports.getUserFollowing = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId)
      .populate("following", "name handle avatar _id")
      .select("following")
      .lean()
      .exec();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const raw = user.following || [];
    const following = raw.filter(Boolean).map((f) => ({
      id: (f._id || f.id || "").toString(),
      name: f.name || "User",
      handle: f.handle || "",
      avatar: f.avatar || ""
    }));
    return res.status(200).json({ success: true, count: following.length, following });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


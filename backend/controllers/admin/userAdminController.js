const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const Post = require("../../models/Post");
const { getCachedRates } = require("../../utils/exchangeRate");

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
  const kycVerified = user.kycStatus === "verified";
  let userStatus = "Pending";
  if (user.isBanned) {
    userStatus = "Banned";
  } else if (user.isSuspicious) {
    userStatus = "Flagged";
  } else if (kycVerified) {
    userStatus = "Verified";
  } else if (user.kycStatus === "pending") {
    userStatus = "Pending";
  } else {
    userStatus = "Unsubmitted";
  }

  return {
    id: user._id.toString(),
    name: user.name || "User",
    email: user.email || "",
    role: user.isPremium ? "Premium" : (user.role === "User" ? "Standard" : user.role || "Standard"),
    phone: user.phone || "",
    bio: user.bio || "",
    status: userStatus,
    kycStatus: user.kycStatus || "unsubmitted",
    kycVerified: kycVerified,
    riskScore: user.isSuspicious ? "High" : "Low",
    joined,
    walletBalance: user.rechargeCoins || 0,
    totalEarnings: user.earningCoins || 0,
    campaigns: 0,
    isBanned: user.isBanned || false,
    isSuspicious: user.isSuspicious || false,
    referralCode: user.referralCode || "",
    referralCount: user.referralCount || 0,
    referredBy: user.referredBy ? (user.referredBy.name || "User") : "None",
    referredById: user.referredBy ? (user.referredBy._id || user.referredBy).toString() : null,
    aadharFront: "",
    aadharBack: "",
    avatar: user.avatar || "",
    countryCode: user.countryCode || "",
    countryName: user.countryName || "",
    currencyCode: user.currencyCode || "INR",
    currencySymbol: user.currencySymbol || "₹",
    state: user.state || "",
    language: user.language || "English",
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
    const roleFilter = req.query.role || "all";
    const statusFilter = req.query.status || "all";
    const kycFilter = req.query.kyc || "all";

    const filter = {};
    const conditions = [];

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&"), "i");
      conditions.push({ $or: [{ name: regex }, { email: regex }] });
    }

    if (req.query.flagged === "true") {
      conditions.push({ $or: [{ isBanned: true }, { isSuspicious: true }] });
    }

    // Role (Premium vs Standard) filtering
    if (roleFilter === "Premium" || roleFilter === "VIP User" || roleFilter === "premium") {
      conditions.push({ isPremium: true });
    } else if (roleFilter === "Standard" || roleFilter === "standard") {
      conditions.push({ isPremium: { $ne: true } });
    }

    // Status filtering (Verified, Pending, Flagged, Banned)
    if (statusFilter === "Verified") {
      conditions.push({ kycStatus: "verified" });
    } else if (statusFilter === "Pending") {
      conditions.push({ kycStatus: "pending" });
    } else if (statusFilter === "Flagged") {
      conditions.push({ isSuspicious: true });
    } else if (statusFilter === "Banned") {
      conditions.push({ isBanned: true });
    }

    // KYC filtering
    if (kycFilter === "verified") {
      conditions.push({ kycStatus: "verified" });
    } else if (kycFilter === "pending") {
      conditions.push({ kycStatus: "pending" });
    } else if (kycFilter === "unsubmitted") {
      conditions.push({ kycStatus: { $in: ["unsubmitted", null] } });
    }

    if (conditions.length > 0) {
      filter.$and = conditions;
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name email role avatar createdAt followers following referralCode referralCount referredBy isBanned isSuspicious countryName state currencyCode currencySymbol phone bio isPremium kycStatus")
      .populate("referredBy", "name")
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
      .populate("referredBy", "name email _id")
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

    let localRate = 1;
    const currencyCode = base.currencyCode || "INR";
    if (currencyCode !== "INR") {
      try {
        const { rates } = await getCachedRates();
        const inrRate = rates["INR"];
        const targetRate = rates[currencyCode];
        if (inrRate && targetRate) {
          localRate = targetRate / inrRate;
        }
      } catch (err) {
        console.error("Failed to fetch rates for admin user detail", err);
      }
    }

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
      walletBalanceLocal: base.walletBalance * localRate,
      totalEarningsLocal: base.totalEarnings * localRate,
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
exports.toggleBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.isBanned = !user.isBanned;
    await user.save();
    return res.status(200).json({ success: true, user: toAdminUserSummary(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleSuspicious = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.isSuspicious = !user.isSuspicious;
    await user.save();
    return res.status(200).json({ success: true, user: toAdminUserSummary(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, avatar, status } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate a basic referral code using the first name
    const baseCode = name.split(" ")[0].toUpperCase().replace(/[^A-Z0-9]/g, "");
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referralCode = `${baseCode}${randomStr}`;

    const isPremium = role === "Premium" || role === "VIP User";
    
    let kycStatus = "unsubmitted";
    let isSuspicious = false;
    if (status === "Verified") {
      kycStatus = "verified";
    } else if (status === "Pending") {
      kycStatus = "pending";
    } else if (status === "Flagged") {
      isSuspicious = true;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: isPremium ? "User" : (role || "User"),
      isPremium,
      phone: phone || "",
      referralCode,
      avatar: avatar || "",
      kycStatus,
      isSuspicious,
      isEmailVerified: true // Auto-verify admin created users
    });

    return res.status(201).json({ success: true, user: toAdminUserSummary(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const updates = req.body || {};
    const allowedFields = ["name", "email", "phone", "bio", "role", "countryName", "state", "avatar"];
    const updateData = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) updateData[key] = updates[key];
    }
    if (updates.role !== undefined) {
      updateData.isPremium = (updates.role === "Premium" || updates.role === "VIP User");
      if (updateData.isPremium) {
        updateData.role = "User";
      }
    }
    if (updates.status !== undefined) {
      if (updates.status === "Verified") {
        updateData.kycStatus = "verified";
        updateData.isSuspicious = false;
        updateData.isBanned = false;
      } else if (updates.status === "Pending") {
        updateData.kycStatus = "pending";
        updateData.isSuspicious = false;
        updateData.isBanned = false;
      } else if (updates.status === "Flagged") {
        updateData.isSuspicious = true;
      }
    }
    const user = await User.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, user: toAdminUserSummary(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const { deleteUserCascade } = require("../../utils/userDeletion");

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    // Perform cascade deletion
    await deleteUserCascade(req.params.id);
    
    return res.status(200).json({ success: true, user: toAdminUserSummary(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


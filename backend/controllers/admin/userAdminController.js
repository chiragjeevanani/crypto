const User = require("../../models/User");

// Map a User document into the shape expected by the admin UI
function toAdminUserSummary(user) {
  const createdAt =
    user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt || Date.now());
  const joined = createdAt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });

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
    avatar: user.avatar || ""
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
      .exec();

    const mapped = users.map(toAdminUserSummary);

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
    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const base = toAdminUserSummary(user);

    // Enrich with placeholder histories so existing UI keeps working
    const detail = {
      ...base,
      kycStatus: base.kycVerified ? "approved" : "pending",
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


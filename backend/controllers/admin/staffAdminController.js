const bcrypt = require("bcryptjs");
const StaffMember = require("../../models/StaffMember");

const VALID_MENUS = [
  "dashboard", "users", "content", "categories", "nfts", "voting",
  "music", "auctions", "locations", "campaigns", "advertisers", "deals",
  "wallet", "withdrawals", "gifts", "reports", "audit", "kyc", "settings"
];

/** POST /api/admin/staff */
const createStaffMember = async (req, res) => {
  try {
    const { name, email, password, role, grantedMenus } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Name, email, password and role are required" });
    }
    if (!["staff", "team_leader"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be 'staff' or 'team_leader'" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const existing = await StaffMember.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "A staff member with that email already exists" });
    }

    // Sanitize grantedMenus to only include valid keys
    const menus = Array.isArray(grantedMenus)
      ? grantedMenus.filter(m => VALID_MENUS.includes(m))
      : [];

    const hashedPassword = await bcrypt.hash(password, 12);

    const staff = await StaffMember.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      grantedMenus: menus,
      createdByAdmin: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      staff: safeStaff(staff),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/admin/staff */
const listStaffMembers = async (req, res) => {
  try {
    const { search = "", role = "", page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role && ["staff", "team_leader"].includes(role)) {
      query.role = role;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      StaffMember.find(query)
        .select("-password -resetPasswordOtp -resetPasswordExpires")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      StaffMember.countDocuments(query),
    ]);

    return res.status(200).json({ success: true, staff: items, total, page: Number(page) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/admin/staff/:id */
const getStaffMember = async (req, res) => {
  try {
    const staff = await StaffMember.findById(req.params.id)
      .select("-password -resetPasswordOtp -resetPasswordExpires")
      .lean();
    if (!staff) return res.status(404).json({ success: false, message: "Staff member not found" });
    return res.status(200).json({ success: true, staff });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** PATCH /api/admin/staff/:id */
const updateStaffMember = async (req, res) => {
  try {
    const { name, email, role, grantedMenus, phone, avatar } = req.body;
    const staff = await StaffMember.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff member not found" });

    if (email && email.toLowerCase() !== staff.email) {
      const duplicate = await StaffMember.findOne({ email: email.toLowerCase(), _id: { $ne: staff._id } });
      if (duplicate) return res.status(409).json({ success: false, message: "Email already in use by another staff member" });
      staff.email = email.toLowerCase().trim();
    }
    if (name) staff.name = name.trim();
    if (role && ["staff", "team_leader"].includes(role)) staff.role = role;
    if (Array.isArray(grantedMenus)) staff.grantedMenus = grantedMenus.filter(m => VALID_MENUS.includes(m));
    if (phone !== undefined) staff.phone = phone;
    if (avatar !== undefined) staff.avatar = avatar;

    await staff.save();
    return res.status(200).json({ success: true, message: "Staff member updated", staff: safeStaff(staff) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** PATCH /api/admin/staff/:id/toggle */
const toggleStaffActive = async (req, res) => {
  try {
    const staff = await StaffMember.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff member not found" });

    staff.isActive = !staff.isActive;
    await staff.save();
    return res.status(200).json({
      success: true,
      message: `Staff member ${staff.isActive ? "activated" : "deactivated"}`,
      isActive: staff.isActive,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** DELETE /api/admin/staff/:id */
const deleteStaffMember = async (req, res) => {
  try {
    const staff = await StaffMember.findByIdAndDelete(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff member not found" });
    return res.status(200).json({ success: true, message: "Staff member deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Strip sensitive fields before sending to client
const safeStaff = (s) => ({
  id: s._id,
  name: s.name,
  email: s.email,
  role: s.role,
  grantedMenus: s.grantedMenus,
  isActive: s.isActive,
  avatar: s.avatar || "",
  phone: s.phone || "",
  lastLoginAt: s.lastLoginAt,
  createdAt: s.createdAt,
});

module.exports = {
  createStaffMember,
  listStaffMembers,
  getStaffMember,
  updateStaffMember,
  toggleStaffActive,
  deleteStaffMember,
};

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getJwtSecret = () => process.env.JWT_SECRET || "change-me";
const accessExpiry = process.env.JWT_ACCESS_EXPIRES_IN || "1d";
const refreshExpiry = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const resolveLocaleFromCountry = (countryInput) => {
  const code = String(countryInput || "").trim().toUpperCase();
  // Minimal mapping; extend as needed
  const table = {
    IN: { countryCode: "IN", countryName: "India", currencyCode: "INR", currencySymbol: "₹" },
    US: { countryCode: "US", countryName: "United States", currencyCode: "USD", currencySymbol: "$" },
    GB: { countryCode: "GB", countryName: "United Kingdom", currencyCode: "GBP", currencySymbol: "£" },
    UK: { countryCode: "GB", countryName: "United Kingdom", currencyCode: "GBP", currencySymbol: "£" },
    AE: { countryCode: "AE", countryName: "United Arab Emirates", currencyCode: "AED", currencySymbol: "AED" },
    EU: { countryCode: "EU", countryName: "Eurozone", currencyCode: "EUR", currencySymbol: "€" }
  };

  if (code && table[code]) return table[code];

  // Fallback default to India / INR
  return { countryCode: "IN", countryName: "India", currencyCode: "INR", currencySymbol: "₹" };
};

const signAccessToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role, type: "access" },
    getJwtSecret(),
    { expiresIn: accessExpiry }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role, type: "refresh" },
    getJwtSecret(),
    { expiresIn: refreshExpiry }
  );

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  countryCode: user.countryCode || "IN",
  countryName: user.countryName || "India",
  currencyCode: user.currencyCode || "INR",
  currencySymbol: user.currencySymbol || "₹",
  ...(user.phone && { phone: user.phone }),
  ...(user.bio !== undefined && { bio: user.bio }),
  ...(user.avatar !== undefined && { avatar: user.avatar }),
  ...(user.handle !== undefined && { handle: user.handle })
});

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, countryCode } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Name, email and password are required" });
    }

    const phoneStr = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
    if (phoneStr && phoneStr.length !== 10) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number must be 10 digits" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const locale = resolveLocaleFromCountry(countryCode);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "User",
      ...(phoneStr && { phone: phoneStr }),
      countryCode: locale.countryCode,
      countryName: locale.countryName,
      currencyCode: locale.currencyCode,
      currencySymbol: locale.currencySymbol
    });

    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      refreshToken,
      user: safeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // If there is no user for this email, or it's an admin‑only account,
    // do not allow login through the user sign‑in screen.
    if (!user || user.role !== "User") {
      return res
        .status(401)
        .json({ success: false, message: "Credentials do not match our records" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Password does not match" });
    }

    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      refreshToken,
      user: safeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const adminRoles = ["SuperNode", "Admin", "super_admin", "Developer"];
    const user = await User.findOne({
      email: email.toLowerCase(),
      role: { $in: adminRoles }
    });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }

    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      refreshToken,
      user: safeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const refreshTokens = async (req, res) => {
  try {
    const { refreshToken: tokenFromBody } = req.body;
    const token = tokenFromBody || (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return res.status(400).json({ success: false, message: "Refresh token required" });
    }
    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded.type !== "refresh") {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const newAccess = signAccessToken(user);
    const newRefresh = signRefreshToken(user);
    return res.status(200).json({
      success: true,
      token: newAccess,
      refreshToken: newRefresh,
      user: safeUser(user)
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Refresh token expired" });
    }
    return res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user: safeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const allowed = ["name", "email", "phone", "bio", "avatar", "handle", "countryCode"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === "phone" && req.body[key]) {
          const digits = String(req.body[key]).replace(/\D/g, "");
          if (digits.length !== 10) {
            return res.status(400).json({ success: false, message: "Phone must be 10 digits" });
          }
          updates.phone = digits;
        } else if (key === "email") {
          updates.email = typeof req.body[key] === "string" ? req.body[key].trim().toLowerCase() : req.body[key];
        } else if (key === "countryCode") {
          const locale = resolveLocaleFromCountry(req.body[key]);
          updates.countryCode = locale.countryCode;
          updates.countryName = locale.countryName;
          updates.currencyCode = locale.currencyCode;
          updates.currencySymbol = locale.currencySymbol;
        } else {
          updates[key] = typeof req.body[key] === "string" ? req.body[key].trim() : req.body[key];
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user: safeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  loginAdmin,
  refreshTokens,
  getMe,
  updateProfile
};

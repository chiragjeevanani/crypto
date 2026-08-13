const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Country = require("../models/Country");
const KycSubmission = require("../models/KycSubmission");
const path = require("path");
const fs = require("fs");
const { getBaseUrl } = require("../utils/postHelpers");
const { UPLOAD_DIR } = require("../utils/upload");
const { sendOtpEmail, sendVerificationEmail } = require("../utils/mailer");


const getJwtSecret = () => process.env.JWT_SECRET || "change-me";
const accessExpiry = process.env.JWT_ACCESS_EXPIRES_IN || "7d";
const refreshExpiry = process.env.JWT_REFRESH_EXPIRES_IN || "60d";

/**
 * Resolve country locale from DB (Country collection).
 * Falls back to a hardcoded table for safety, then defaults to India.
 */
const resolveLocaleFromCountry = async (countryInput) => {
  const code = String(countryInput || "").trim().toUpperCase();
  if (!code) return { countryCode: "IN", countryName: "India", currencyCode: "INR", currencySymbol: "₹" };

  // 1. Try DB lookup first (covers all admin-managed countries)
  try {
    const dbCountry = await Country.findOne({ code }).lean();
    if (dbCountry) {
      return {
        countryCode: dbCountry.code,
        countryName: dbCountry.name,
        currencyCode: dbCountry.currencyCode,
        currencySymbol: dbCountry.currencySymbol,
      };
    }
  } catch (e) {
    console.warn("[Auth] Country DB lookup failed, using fallback:", e.message);
  }

  // 2. Hardcoded fallback table for critical countries (safety net)
  const fallback = {
    IN:  { countryCode: "IN",  countryName: "India",                currencyCode: "INR", currencySymbol: "₹"   },
    US:  { countryCode: "US",  countryName: "United States",        currencyCode: "USD", currencySymbol: "$"   },
    AU:  { countryCode: "AU",  countryName: "Australia",            currencyCode: "AUD", currencySymbol: "A$"  },
    GB:  { countryCode: "GB",  countryName: "United Kingdom",       currencyCode: "GBP", currencySymbol: "£"   },
    CA:  { countryCode: "CA",  countryName: "Canada",               currencyCode: "CAD", currencySymbol: "CA$" },
    AE:  { countryCode: "AE",  countryName: "United Arab Emirates", currencyCode: "AED", currencySymbol: "AED" },
    SG:  { countryCode: "SG",  countryName: "Singapore",            currencyCode: "SGD", currencySymbol: "S$"  },
    EU:  { countryCode: "EU",  countryName: "Eurozone",             currencyCode: "EUR", currencySymbol: "€"   },
    DE:  { countryCode: "DE",  countryName: "Germany",              currencyCode: "EUR", currencySymbol: "€"   },
    FR:  { countryCode: "FR",  countryName: "France",               currencyCode: "EUR", currencySymbol: "€"   },
    JP:  { countryCode: "JP",  countryName: "Japan",                currencyCode: "JPY", currencySymbol: "¥"   },
    CN:  { countryCode: "CN",  countryName: "China",                currencyCode: "CNY", currencySymbol: "¥"   },
    SA:  { countryCode: "SA",  countryName: "Saudi Arabia",         currencyCode: "SAR", currencySymbol: "﷼"   },
    NZ:  { countryCode: "NZ",  countryName: "New Zealand",          currencyCode: "NZD", currencySymbol: "NZ$" },
    ZA:  { countryCode: "ZA",  countryName: "South Africa",         currencyCode: "ZAR", currencySymbol: "R"   },
    NG:  { countryCode: "NG",  countryName: "Nigeria",              currencyCode: "NGN", currencySymbol: "₦"   },
    BR:  { countryCode: "BR",  countryName: "Brazil",               currencyCode: "BRL", currencySymbol: "R$"  },
    MX:  { countryCode: "MX",  countryName: "Mexico",               currencyCode: "MXN", currencySymbol: "MX$" },
    PK:  { countryCode: "PK",  countryName: "Pakistan",             currencyCode: "PKR", currencySymbol: "₨"   },
    BD:  { countryCode: "BD",  countryName: "Bangladesh",           currencyCode: "BDT", currencySymbol: "৳"   },
    MY:  { countryCode: "MY",  countryName: "Malaysia",             currencyCode: "MYR", currencySymbol: "RM"  },
    ID:  { countryCode: "ID",  countryName: "Indonesia",            currencyCode: "IDR", currencySymbol: "Rp"  },
    PH:  { countryCode: "PH",  countryName: "Philippines",          currencyCode: "PHP", currencySymbol: "₱"   },
    TH:  { countryCode: "TH",  countryName: "Thailand",             currencyCode: "THB", currencySymbol: "฿"   },
    VN:  { countryCode: "VN",  countryName: "Vietnam",              currencyCode: "VND", currencySymbol: "₫"   },
    KR:  { countryCode: "KR",  countryName: "South Korea",          currencyCode: "KRW", currencySymbol: "₩"   },
    RU:  { countryCode: "RU",  countryName: "Russia",               currencyCode: "RUB", currencySymbol: "₽"   },
    TR:  { countryCode: "TR",  countryName: "Turkey",               currencyCode: "TRY", currencySymbol: "₺"   },
    EG:  { countryCode: "EG",  countryName: "Egypt",                currencyCode: "EGP", currencySymbol: "E£"  },
    UK:  { countryCode: "GB",  countryName: "United Kingdom",       currencyCode: "GBP", currencySymbol: "£"   },
  };

  if (fallback[code]) return fallback[code];

  // 3. Last resort — store the code as-is with unknown currency
  console.warn(`[Auth] Unknown country code '${code}', storing as-is.`);
  return { countryCode: code, countryName: code, currencyCode: "USD", currencySymbol: "$" };
};

const generateReferralCode = (name) => {
  const prefix = String(name || "USER").slice(0, 3).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${random}`;
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

const safeUser = (user, kyc = null) => {
  const safe = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || "",
    phone: user.phone || "",
    bio: user.bio || "",
    handle: user.handle || "",
    countryCode: user.countryCode || "",
    countryName: user.countryName || "",
    currencyCode: user.currencyCode || "",
    currencySymbol: user.currencySymbol || "",
    referralCount: user.referralCount || 0,
    referralCode: user.referralCode || "",
    isPremium: user.isPremium || false,
    state: user.state || "",
    language: user.language || "English",
    languages: user.languages || [],
    hasSelectedLanguages: user.hasSelectedLanguages || false,
    kycStatus: user.kycStatus || "unsubmitted",
    isMonetized: user.isMonetized || false,
    walletAddress: user.walletAddress || "",
    kyc: kyc ? {
        status: kyc.status,
        aadharNumber: kyc.aadharNumber,
        panNumber: kyc.panNumber,
        rejectionReason: kyc.rejectionReason || "",
        hasAadharFront: !!kyc.documents?.aadharFrontUrl,
        hasAadharBack: !!kyc.documents?.aadharBackUrl,
        hasPanCard: !!kyc.documents?.panCardUrl
    } : null
  };
  return safe;
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, countryCode, state, language, referralCode: signupReferralCode, agreedToTerms } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Name, email and password are required" });
    }

    if (!agreedToTerms) {
      return res
        .status(400)
        .json({ success: false, message: "You must agree to the Terms and Conditions and Privacy Policy" });
    }

    const phoneStr = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
    if (phoneStr && (phoneStr.length < 6 || phoneStr.length > 15)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid phone number length" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.isEmailVerified) {
        return res.status(409).json({ success: false, message: "Email already registered" });
      } else {
        await User.deleteOne({ _id: existing._id });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const locale = await resolveLocaleFromCountry(countryCode);
    
    // Check for referrer
    let referrerId = null;
    if (signupReferralCode) {
      const referrer = await User.findOne({ referralCode: String(signupReferralCode).toUpperCase() });
      if (referrer) {
        referrerId = referrer._id;
      } else {
        return res.status(400).json({ success: false, message: "Invalid referral code" });
      }
    }

    const referralCode = generateReferralCode(name);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "User",
      ...(phoneStr && { phone: phoneStr }),
      countryCode: locale.countryCode,
      countryName: locale.countryName,
      currencyCode: locale.currencyCode,
      currencySymbol: locale.currencySymbol,
      referralCode,
      referredBy: referrerId,
      state: state || "",
      language: language || "English",
      agreedToTerms
    });

    // If referred, increment referrer count
    if (referrerId) {
      const updatedReferrer = await User.findByIdAndUpdate(
        referrerId,
        { $inc: { referralCount: 1 } },
        { new: true }
      );
      try {
        const { emitToUser } = require("../utils/socket");
        emitToUser(referrerId, "referral_count_update", {
          referralCount: updatedReferrer?.referralCount || 0
        });
      } catch (socketErr) {
        console.error("[Referral] Failed to emit count update:", socketErr);
      }
    }

    // Generate verification OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    await User.updateOne(
      { _id: user._id },
      { $set: { emailVerificationOtp: hashedOtp, emailVerificationExpires: Date.now() + 10 * 60 * 1000 } }
    );
    
    sendVerificationEmail(user.email, otp);

    return res.status(201).json({
      success: true,
      requireVerification: true,
      email: user.email,
      message: "Please verify your email address. An OTP has been sent."
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

    if (!user.isEmailVerified) {
      // Generate new verification OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);
      
      await User.updateOne(
        { _id: user._id },
        { $set: { emailVerificationOtp: hashedOtp, emailVerificationExpires: Date.now() + 10 * 60 * 1000 } }
      );
      
      sendVerificationEmail(user.email, otp);
      
      return res.status(403).json({ 
        success: false, 
        requireVerification: true, 
        email: user.email,
        message: "Please verify your email to log in. A new OTP has been sent." 
      });
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

    // Auto-generate referral code if missing (for legacy users)
    if (!user.referralCode) {
      user.referralCode = generateReferralCode(user.name);
      await user.save();
    }

    const kyc = await KycSubmission.findOne({ userId: user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, user: safeUser(user, kyc) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Removed req.body logging to prevent crashes from large base64 strings

    const baseUrl = getBaseUrl(req);
    const allowed = ["name", "email", "phone", "bio", "avatar", "handle", "countryCode", "state", "language", "languages", "hasSelectedLanguages"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === "phone" && req.body[key]) {
          const rawPhone = String(req.body[key]);
          if (!/^\+?[0-9\s-()]+$/.test(rawPhone)) {
            return res.status(400).json({ success: false, message: "Phone number must contain only digits" });
          }
          const digits = rawPhone.replace(/\D/g, "");
          if (digits.length < 6 || digits.length > 15) {
            return res.status(400).json({ success: false, message: "Phone number must be between 6 and 15 digits" });
          }
          updates.phone = digits;
        } else if (key === "email") {
          const email = typeof req.body[key] === "string" ? req.body[key].trim().toLowerCase() : "";
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email address format" });
          }
          updates.email = email;
        } else if (key === "countryCode") {
          const locale = await resolveLocaleFromCountry(req.body[key]);
          updates.countryCode = locale.countryCode;
          updates.countryName = locale.countryName;
          updates.currencyCode = locale.currencyCode;
          updates.currencySymbol = locale.currencySymbol;
        } else if (key === "avatar") {
          const raw = typeof req.body[key] === "string" ? req.body[key].trim() : req.body[key];
          if (typeof raw === "string" && raw.startsWith("/uploads/")) {
            updates.avatar = `${baseUrl}${raw}`;
          } else {
            updates.avatar = raw;
          }
        } else if (key === "bio") {
          updates.bio = typeof req.body[key] === "string" ? req.body[key].trim() : req.body[key];
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

    return res.status(200).json({ success: true, user: safeUser(user), _v: "v1.1-fixed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "Avatar file is required" });
    }

    const baseUrl = getBaseUrl(req);
    let avatarUrl = `${baseUrl}/uploads/${file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { avatar: avatarUrl } },
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



const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return res.status(200).json({ success: true, message: "If your email is registered, an OTP has been sent." });
    }

    // Generate 4 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await User.updateOne(
      { _id: user._id },
      { $set: { resetPasswordOtp: hashedOtp, resetPasswordExpires: Date.now() + 10 * 60 * 1000 } }
    );

    sendOtpEmail(user.email, otp);

    return res.status(200).json({ success: true, message: "OTP has been sent." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.resetPasswordOtp || !user.resetPasswordExpires) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    if (Date.now() > user.resetPasswordExpires) {
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.resetPasswordOtp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword, resetPasswordOtp: null, resetPasswordExpires: null } }
    );

    return res.status(200).json({ success: true, message: "Password reset successfully. You can now login." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email is already verified" });
    }

    if (!user.emailVerificationOtp || !user.emailVerificationExpires) {
      return res.status(400).json({ success: false, message: "No pending verification found" });
    }

    if (Date.now() > user.emailVerificationExpires) {
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.emailVerificationOtp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Mark as verified
    await User.updateOne(
      { _id: user._id },
      { $set: { isEmailVerified: true, emailVerificationOtp: null, emailVerificationExpires: null } }
    );

    // Credit referral reward if user was referred
    if (user.referredBy) {
      const WalletTransaction = require("../models/WalletTransaction");
      const existingTx = await WalletTransaction.findOne({
        userId: user.referredBy,
        referenceType: "referral_reward",
        referenceId: user._id
      });
      
      if (!existingTx) {
        const REFERRAL_BONUS_COINS = 100;
        await User.findByIdAndUpdate(user.referredBy, {
          $inc: { earningCoins: REFERRAL_BONUS_COINS }
        });
        
        await WalletTransaction.create({
          userId: user.referredBy,
          type: "deposit",
          referenceType: "referral_reward",
          referenceId: user._id,
          coins: REFERRAL_BONUS_COINS,
          amount: REFERRAL_BONUS_COINS,
          status: "success",
          description: `Referral reward for inviting ${user.name}`
        });
      }
    }

    // Do not auto-login, just return success
    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in."
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resendVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Prevent enumeration
      return res.status(200).json({ success: true, message: "If registered, an OTP has been sent." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email is already verified" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    await User.updateOne(
      { _id: user._id },
      { $set: { emailVerificationOtp: hashedOtp, emailVerificationExpires: Date.now() + 10 * 60 * 1000 } }
    );
    
    sendVerificationEmail(user.email, otp);

    return res.status(200).json({ success: true, message: "A new OTP has been sent." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


const { deleteUserCascade } = require("../utils/userDeletion");

const deleteMyAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required to delete your account" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    await deleteUserCascade(userId);

    return res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new password are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
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
  updateProfile,
  updateAvatar,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationOtp,
  deleteMyAccount,
  changePassword
};

const express = require("express");
const {
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
  resendVerificationOtp
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../utils/upload");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdmin);
router.post("/refresh", refreshTokens);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationOtp);

router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);
router.patch("/profile/avatar", protect, upload.single("avatar"), updateAvatar);

module.exports = router;

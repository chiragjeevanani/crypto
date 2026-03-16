const express = require("express");
const {
  registerUser,
  loginUser,
  loginAdmin,
  refreshTokens,
  getMe,
  updateProfile,
  updateAvatar
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../utils/upload");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdmin);
router.post("/refresh", refreshTokens);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);
router.patch("/profile/avatar", protect, upload.single("avatar"), updateAvatar);

module.exports = router;

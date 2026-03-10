const express = require("express");
const {
  registerUser,
  loginUser,
  loginAdmin,
  refreshTokens,
  getMe,
  updateProfile
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdmin);
router.post("/refresh", refreshTokens);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);

module.exports = router;

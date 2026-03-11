const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const {
  listUsers,
  getUserDetail,
  getUserFollowers,
  getUserFollowing
} = require("../../controllers/admin/userAdminController");

const router = express.Router();
const adminAuth = [protect, authorize("SuperNode", "Admin", "super_admin", "Developer")];

// Only admin roles can see/manage users
router.get("/", ...adminAuth, listUsers);

router.get("/:id/followers", ...adminAuth, getUserFollowers);
router.get("/:id/following", ...adminAuth, getUserFollowing);
router.get("/:id", ...adminAuth, getUserDetail);

module.exports = router;


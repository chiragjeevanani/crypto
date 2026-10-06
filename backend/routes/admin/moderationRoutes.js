const express = require("express");
const { getPosts, getPostById, updatePostStatus, updatePostTitle, getModerationStats, acknowledgeBusinessAds } = require("../../controllers/admin/moderationController");
const { protect, authorize } = require("../../middleware/authMiddleware");

const router = express.Router();

const adminRoles = ["SuperNode", "Admin", "super_admin", "Developer"];

router.get("/", protect, authorize(...adminRoles), getPosts);
router.get("/stats", protect, authorize(...adminRoles), getModerationStats);
router.post("/acknowledge-ads", protect, authorize(...adminRoles), acknowledgeBusinessAds);
router.get("/:id", protect, authorize(...adminRoles), getPostById);
router.patch("/:id/status", protect, authorize(...adminRoles), updatePostStatus);
router.patch("/:id/title", protect, authorize(...adminRoles), updatePostTitle);

module.exports = router;

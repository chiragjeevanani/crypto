const express = require("express");
const { getPosts, getPostById, updatePostStatus } = require("../../controllers/admin/moderationController");
const { protect, authorize } = require("../../middleware/authMiddleware");

const router = express.Router();

const adminRoles = ["SuperNode", "Admin", "super_admin", "Developer"];

router.get("/", protect, authorize(...adminRoles), getPosts);
router.get("/:id", protect, authorize(...adminRoles), getPostById);
router.patch("/:id/status", protect, authorize(...adminRoles), updatePostStatus);

module.exports = router;

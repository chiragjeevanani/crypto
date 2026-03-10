const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const {
  toggleFollowUser,
  getFollowers,
  getFollowing
} = require("../../controllers/user/followController");

const router = express.Router();

// Toggle follow/unfollow a user
router.post("/:id/toggle", protect, toggleFollowUser);

// Get followers / following lists
router.get("/:id/followers", protect, getFollowers);
router.get("/:id/following", protect, getFollowing);

module.exports = router;


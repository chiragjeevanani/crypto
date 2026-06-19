const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { upload } = require("../../utils/upload");
const {
  createStory,
  getFeedStories,
  getUserStories,
  deleteStory
} = require("../../controllers/user/storyController");

const router = express.Router();

router.post("/", protect, authorize("User", "SuperNode", "Admin", "super_admin", "Developer"), upload.single("media"), createStory);
router.get("/feed", protect, getFeedStories);
router.get("/user/:userId", protect, getUserStories);
router.delete("/:id", protect, authorize("User", "Admin", "SuperNode", "super_admin", "Developer"), deleteStory);

module.exports = router;


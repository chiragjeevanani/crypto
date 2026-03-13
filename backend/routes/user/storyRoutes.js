const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { upload } = require("../../utils/upload");
const {
  createStory,
  getFeedStories,
  deleteStory
} = require("../../controllers/user/storyController");

const router = express.Router();

router.post("/", protect, authorize("User"), upload.single("media"), createStory);
router.get("/feed", protect, getFeedStories);
router.delete("/:id", protect, authorize("User"), deleteStory);

module.exports = router;


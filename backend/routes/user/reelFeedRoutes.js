const express = require("express");
const { getReelsFeed } = require("../../controllers/user/reelFeedController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getReelsFeed);

module.exports = router;

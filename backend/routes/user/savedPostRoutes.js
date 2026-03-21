const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const { toggleSave, getSavedPosts, getSavedPostIds } = require("../../controllers/user/savedPostController");

const router = express.Router();

router.post("/toggle", protect, toggleSave);
router.get("/ids", protect, getSavedPostIds);
router.get("/:userId", protect, getSavedPosts);

module.exports = router;

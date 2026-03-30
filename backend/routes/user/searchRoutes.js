const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const { search, getSuggestedUsers, getSuggestedReels, dismissSuggestedUser, getUserProfile } = require("../../controllers/user/searchController");

const router = express.Router();

router.get("/suggested-users", protect, getSuggestedUsers);
router.post("/suggested-users/dismiss/:id", protect, dismissSuggestedUser);
router.get("/suggested-reels", protect, getSuggestedReels);
router.get("/:id", protect, getUserProfile);
router.get("/", protect, search);

module.exports = router;

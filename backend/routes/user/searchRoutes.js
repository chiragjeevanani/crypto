const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const { search, getSuggestedUsers, getSuggestedReels, dismissSuggestedUser } = require("../../controllers/user/searchController");

const router = express.Router();

router.get("/suggested-users", protect, getSuggestedUsers);
router.post("/suggested-users/dismiss/:id", protect, dismissSuggestedUser);
router.get("/suggested-reels", protect, getSuggestedReels);
router.get("/", protect, search);

module.exports = router;

const express = require("express");
const {
  getCampaigns,
  getCampaignById,
  joinCampaign,
  submitEntry,
  getSubmissions,
  voteSubmission,
  trackCampaign
} = require("../../controllers/user/campaignController");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { upload } = require("../../utils/upload");

const router = express.Router();

router.get("/", protect, getCampaigns);
router.get("/:id", protect, getCampaignById);
router.post("/:id/join", protect, authorize("User", "Admin", "SuperNode", "super_admin", "Developer"), joinCampaign);
router.post("/:id/submissions", protect, authorize("User", "Admin", "SuperNode", "super_admin", "Developer"), upload.fields([
  { name: "bill", maxCount: 1 },
  { name: "product", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
  { name: "reel", maxCount: 1 }
]), submitEntry);
router.get("/:id/submissions", protect, getSubmissions);
router.post("/:id/submissions/:submissionId/vote", protect, authorize("User", "Admin", "SuperNode", "super_admin", "Developer"), voteSubmission);
router.post("/:id/track", protect, trackCampaign);

module.exports = router;

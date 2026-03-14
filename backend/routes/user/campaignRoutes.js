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
router.post("/:id/join", protect, authorize("User"), joinCampaign);
router.post("/:id/submissions", protect, authorize("User"), upload.single("media"), submitEntry);
router.get("/:id/submissions", protect, getSubmissions);
router.post("/:id/submissions/:submissionId/vote", protect, authorize("User"), voteSubmission);
router.post("/:id/track", protect, trackCampaign);

module.exports = router;

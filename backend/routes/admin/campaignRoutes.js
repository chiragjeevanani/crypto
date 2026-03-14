const express = require("express");
const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  updateStatus,
  deleteCampaign,
  getSubmissions,
  declareWinners,
  markRewardDistributed
} = require("../../controllers/admin/campaignAdminController");
const { protect, authorize } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("SuperNode", "Admin", "super_admin", "Developer"));

router.post("/", createCampaign);
router.get("/", getCampaigns);
router.get("/:id", getCampaignById);
router.patch("/:id", updateCampaign);
router.patch("/:id/status", updateStatus);
router.delete("/:id", deleteCampaign);
router.get("/:id/submissions", getSubmissions);
router.post("/:id/declare-winners", declareWinners);
router.patch("/:id/winners/:submissionId/distribute", markRewardDistributed);

module.exports = router;

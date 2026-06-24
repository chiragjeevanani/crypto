const express = require("express");
const {
  createDeal,
  listDeals,
  deleteDeal
} = require("../../controllers/admin/dealAdminController");
const { protect, authorize } = require("../../middleware/authMiddleware");

const router = express.Router();

// Public route to get all deals (so users can view trending deals on discover)
router.get("/public", listDeals);

// Admin-protected routes
router.use(protect, authorize("Admin", "SuperNode", "super_admin", "Developer"));
router.post("/", createDeal);
router.get("/", listDeals);
router.delete("/:id", deleteDeal);

module.exports = router;

const express = require("express");
const router = express.Router();
const promotionAdminController = require("../../controllers/admin/promotionAdminController");
const { protect, authorize } = require("../../middleware/authMiddleware");

// All admin promotion routes are protected and restricted to admin roles
router.get("/settings", protect, authorize("SuperNode", "Admin", "super_admin", "Developer"), promotionAdminController.getSettings);
router.patch("/settings", protect, authorize("SuperNode", "Admin", "super_admin", "Developer"), promotionAdminController.updateSettings);

module.exports = router;

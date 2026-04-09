const express = require("express");
const { getReports, handleReportAction } = require("../../controllers/admin/reportAdminController");
const { protect, authorize } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("Admin", "super_admin", "Developer", "SuperNode"));

router.get("/", getReports);
router.post("/:id/action", handleReportAction);

module.exports = router;

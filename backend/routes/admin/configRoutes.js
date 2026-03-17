const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { getConfig, updateConfig } = require("../../controllers/admin/configAdminController");

const router = express.Router();
const adminRoles = ["SuperNode", "Admin", "super_admin", "Developer"];
const adminAuth = [protect, authorize(...adminRoles)];

router.get("/", ...adminAuth, getConfig);
router.put("/", ...adminAuth, updateConfig);

module.exports = router;

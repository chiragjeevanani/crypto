const express = require("express");
const { getConfig } = require("../controllers/admin/configAdminController");

const router = express.Router();

// Public route to get platform settings (limited to specific fields if needed, but getConfig returns all)
router.get("/", getConfig);

module.exports = router;

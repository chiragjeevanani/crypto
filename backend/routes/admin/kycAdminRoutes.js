const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { listKycSubmissions, reviewKyc } = require("../../controllers/admin/kycAdminController");

const router = express.Router();
const adminRoles = ["SuperNode", "Admin", "super_admin", "Developer"];

router.get("/", protect, authorize(...adminRoles), listKycSubmissions);
router.post("/review", protect, authorize(...adminRoles), reviewKyc);

module.exports = router;

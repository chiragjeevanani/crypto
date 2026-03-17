const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const {
  listWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
} = require("../../controllers/admin/withdrawalAdminController");

const router = express.Router();
const adminRoles = ["SuperNode", "Admin", "super_admin", "Developer"];
const adminAuth = [protect, authorize(...adminRoles)];

router.get("/", ...adminAuth, listWithdrawals);
router.post("/approve", ...adminAuth, approveWithdrawal);
router.post("/reject", ...adminAuth, rejectWithdrawal);

module.exports = router;

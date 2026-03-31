const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const {
  listWalletDeposits,
  listGiftHistory
} = require("../../controllers/admin/transactionAdminController");

const router = express.Router();
const adminRoles = ["SuperNode", "Admin", "super_admin", "Developer"];
const adminAuth = [protect, authorize(...adminRoles)];

router.get("/deposits", ...adminAuth, listWalletDeposits);
router.get("/gifts/history", ...adminAuth, listGiftHistory);

module.exports = router;

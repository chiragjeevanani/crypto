const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const { rateLimit } = require("../../middleware/rateLimit");
const {
  getBalance,
  deposit,
  sendGift,
  listTransactions,
  withdraw
} = require("../../controllers/user/walletController");

const router = express.Router();

router.get("/balance", protect, getBalance);
router.post("/deposit", protect, deposit);
router.get("/transactions", protect, listTransactions);
router.post("/withdraw", protect, rateLimit({ keyPrefix: "withdraw", windowMs: 60000, max: 3 }), withdraw);
router.post("/gift", protect, rateLimit({ keyPrefix: "gift", windowMs: 10000, max: 5 }), sendGift);

module.exports = router;

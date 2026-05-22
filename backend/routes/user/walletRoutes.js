const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const { rateLimit } = require("../../middleware/rateLimit");
const {
  getBalance,
  deposit,
  sendGift,
  listActiveGifts,
  listTransactions,
  withdraw,
  getPayoutMethods,
  addPayoutMethod,
  removePayoutMethod,
  setPrimaryPayoutMethod
} = require("../../controllers/user/walletController");

const router = express.Router();

router.get("/balance", protect, getBalance);
router.get("/gifts", protect, listActiveGifts);
router.get("/gift", protect, listActiveGifts); 
router.post("/deposit", protect, deposit);
router.get("/transactions", protect, listTransactions);
router.post("/withdraw", protect, rateLimit({ keyPrefix: "withdraw", windowMs: 60000, max: 3 }), withdraw);
router.post("/gift", protect, rateLimit({ keyPrefix: "gift", windowMs: 10000, max: 5 }), sendGift);

router.get("/payout-methods", protect, getPayoutMethods);
router.post("/payout-methods", protect, addPayoutMethod);
router.delete("/payout-methods/:id", protect, removePayoutMethod);
router.patch("/payout-methods/:id/primary", protect, setPrimaryPayoutMethod);

module.exports = router;

const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const { initiateRecharge, verifyPayment, handleCallback } = require("../../controllers/user/paymentController");

const router = express.Router();

// Recharge / Deposit initiation
router.post("/recharge", protect, initiateRecharge);

// Verification endpoint (called by frontend after redirect)
router.post("/verify", protect, verifyPayment);

// Callback endpoint (receives PhonePe's POST redirect and sends user back to frontend via GET)
router.all("/callback", handleCallback);

module.exports = router;

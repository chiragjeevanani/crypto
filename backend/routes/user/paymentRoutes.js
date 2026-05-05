const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const { initiateRecharge, verifyPayment, stripeWebhook, handleCallback } = require("../../controllers/user/paymentController");

const router = express.Router();

// ── Stripe Webhook (MUST come before express.json() middleware)
// Uses raw body so Stripe can verify the signature
router.post(
    "/webhook/stripe",
    express.raw({ type: "application/json" }),
    stripeWebhook
);

// ── Recharge / Deposit initiation (auto-routes to Razorpay or Stripe)
router.post("/recharge", protect, initiateRecharge);

// ── Verification endpoint (called by frontend after redirect / modal close)
router.post("/verify", protect, verifyPayment);

// ── Legacy callback
router.all("/callback", handleCallback);

module.exports = router;

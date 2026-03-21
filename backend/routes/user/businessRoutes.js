const express = require("express");
const router = express.Router();
const businessController = require("../../controllers/user/businessController");
const { protect } = require("../../middleware/authMiddleware");

// All business routes are protected (logged‑in users only)
router.post("/initiate-payment", protect, businessController.initiatePayment);
router.post("/verify-payment", protect, businessController.verifyPayment);

module.exports = router;

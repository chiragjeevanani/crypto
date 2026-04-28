const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const { submitKyc, getMyKycStatus } = require("../../controllers/user/kycController");

const router = express.Router();

router.get("/status", protect, getMyKycStatus);
router.post("/submit", protect, submitKyc);

module.exports = router;

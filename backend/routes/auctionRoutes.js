const express = require("express");
const router = express.Router();
const auctionController = require("../controllers/auctionController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { upload } = require("../utils/upload");

const adminRoles = ["SuperNode", "Admin", "super_admin", "Developer"];

// Public Routes
router.get("/", auctionController.getAuctions);
router.get("/:id", auctionController.getAuctionDetail);

// User Routes (Protected)
router.post("/initiate-listing-fee", protect, auctionController.initiateListingFee);
router.post("/", protect, upload.single("media"), auctionController.createAuction);
router.post("/:id/bid", protect, auctionController.placeBid);
router.put("/:id", protect, upload.single("media"), auctionController.updateAuction);
router.delete("/:id", protect, auctionController.deleteAuction);

// Admin Routes (Admin Only)
router.patch("/:id/status", protect, authorize(...adminRoles), auctionController.updateStatus);

module.exports = router;

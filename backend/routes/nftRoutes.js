const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getMyCollection,
  getUserCollection,
  getNFTDetail,
  getMarketplace,
  buyCollectible,
  buyPostNFT,
  getOwnershipCertificate,
  migrateNFTOwnerships,
} = require("../controllers/nftController");

// ─── Public Routes ─────────────────────────────────────────────────────────

// All live collectibles / marketplace
router.get("/marketplace", getMarketplace);

// Single collectible detail (uses auctionId as tokenId for URL compat)
router.get("/:tokenId", getNFTDetail);

// ─── Authenticated User Routes ─────────────────────────────────────────────
router.use(protect);

// Get logged-in user's collectible collection
router.get("/my/collection", getMyCollection);

// Get any user's collectible collection
router.get("/user/:userId/collection", getUserCollection);

// Claim / buy a collectible after winning an auction
router.post("/buy/:auctionId", buyCollectible);

// Buy an NFT Post directly
router.post("/buy-post/:postId", buyPostNFT);

// Get ownership certificate for a collectible
router.get("/certificate/:auctionId", getOwnershipCertificate);

// ─── Admin Routes ──────────────────────────────────────────────────────────
const adminRoles = ["Admin", "super_admin", "Developer"];

// One-time migration from old NFTOwnership records
router.post(
  "/admin/migrate",
  authorize(...adminRoles),
  migrateNFTOwnerships
);

module.exports = router;

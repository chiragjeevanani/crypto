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
  relistNFT,
  buyResaleNFT,
  placeOffer,
  acceptOffer,
  cancelOffer,
  getOffersForCollectible,
  getMyOffers,
  getResaleListings
} = require("../controllers/nftController");

// ─── Public Routes ─────────────────────────────────────────────────────────

// All live collectibles / marketplace
router.get("/marketplace", getMarketplace);

// Resale listings
router.get("/resale-listings", getResaleListings);

// ─── Authenticated User Routes ─────────────────────────────────────────────
// Get logged-in user's collectible collection
router.get("/my/collection", protect, getMyCollection);

// Get logged-in user's active offers
router.get("/my/offers", protect, getMyOffers);

// Get any user's collectible collection
router.get("/user/:userId/collection", getUserCollection);

// Get offers for a collectible
router.get("/:collectibleId/offers", getOffersForCollectible);

// Single collectible detail (uses auctionId as tokenId for URL compat)
router.get("/:tokenId", getNFTDetail);

// ─── Authenticated User Routes ─────────────────────────────────────────────
router.use(protect);

// Claim / buy a collectible after winning an auction
router.post("/buy/:auctionId", buyCollectible);

// Buy an NFT Post directly
router.post("/buy-post/:postId", buyPostNFT);

// Relist NFT for fixed price
router.post("/:collectibleId/relist", relistNFT);

// Buy resold NFT
router.post("/:collectibleId/buy-resale", buyResaleNFT);

// Place an offer
router.post("/:collectibleId/offer", placeOffer);

// Accept an offer
router.post("/:collectibleId/offer/:offerId/accept", acceptOffer);

// Cancel an offer
router.post("/:collectibleId/offer/:offerId/cancel", cancelOffer);

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

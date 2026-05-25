const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { verifyAlchemySignature } = require("../middleware/alchemyWebhookMiddleware");
const {
  linkWallet,
  getMyCollection,
  getNFTDetail,
  getMarketplace,
  prepareIPFS,
  mintAuctionNFT,
  recordDeposit,
  settleAuction,
  syncOwnershipWebhook,
  claimNFTBySponsor
} = require("../controllers/nftController");

// ─── Public Routes ─────────────────────────────────────────────────────────

// NFT marketplace — all minted NFTs
router.get("/marketplace", getMarketplace);

// Single NFT detail page
router.get("/:tokenId", getNFTDetail);

// Alchemy webhook for syncing secondary market transfers
// Verified by Alchemy signature middleware
router.post("/webhook/transfer", verifyAlchemySignature, syncOwnershipWebhook);

// ─── Authenticated User Routes ─────────────────────────────────────────────
router.use(protect);

// Link MetaMask wallet to account
router.post("/wallet/link", linkWallet);

// Get logged-in user's NFT collection
router.get("/my/collection", getMyCollection);

// Settle NFT with sponsored gas/transaction
router.post("/claim/:auctionId", claimNFTBySponsor);

// Record on-chain vault deposit (winner only)
router.post("/deposit/record/:auctionId", recordDeposit);

// ─── Admin Routes ──────────────────────────────────────────────────────────
// Only Admin and super_admin can mint/settle NFTs
const adminRoles = ["Admin", "super_admin", "Developer"];

// Pin auction media + metadata to IPFS
router.post(
  "/admin/prepare/:auctionId",
  authorize(...adminRoles),
  prepareIPFS
);

// Mint NFT on-chain to the VAULT contract
router.post(
  "/admin/mint/:auctionId",
  authorize(...adminRoles),
  mintAuctionNFT
);

// Settle NFT auction (atomic transfer of NFT and MATIC)
router.post(
  "/admin/settle/:auctionId",
  authorize(...adminRoles),
  settleAuction
);

module.exports = router;

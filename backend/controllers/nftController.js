const Auction = require("../models/Auction");
const Post = require("../models/Post");
const User = require("../models/User");
const CollectibleOwnership = require("../models/CollectibleOwnership");

// ─── Helper: Generate Platform Collectible ID ────────────────────────────────
const generateCollectibleId = async () => {
  const year = new Date().getFullYear();
  const count = await CollectibleOwnership.countDocuments();
  return `KNQ-${year}-${String(count + 1).padStart(4, "0")}`;
};

// ─── Get My Collectible Collection ────────────────────────────────────────────

/**
 * GET /api/nft/my/collection
 * Returns all collectibles owned by the logged-in user (by userId, no wallet required).
 */
const getMyCollection = async (req, res) => {
  const userId = req.user.userId;

  try {
    const ownerships = await CollectibleOwnership.find({ toUserId: userId })
      .populate({
        path: "auctionId",
        select: "title description mediaUrl mediaType highestBid status creator",
        populate: { path: "creator", select: "name handle avatar" }
      })
      .populate({
        path: "postId",
        select: "title caption thumbnail media creator nftPriceINR status",
        populate: { path: "creator", select: "name handle avatar" }
      })
      .sort({ createdAt: -1 });

    const formatted = ownerships.map((o) => {
      const source = o.auctionId || o.postId;
      return {
        collectibleId: o.collectibleId,
        auctionId: o.auctionId?._id || o.postId?._id,
        title: source?.title || source?.caption || "Untitled Collectible",
        description: source?.description || source?.caption || "",
        mediaUrl: source?.mediaUrl || source?.media?.url || source?.thumbnail || "",
        mediaType: source?.mediaType || source?.media?.type || "image",
        salePrice: o.salePrice,
        certificateUrl: o.certificateUrl,
        acquiredAt: o.createdAt,
        creator: source?.creator || null,
        status: source?.status || source?.nftStatus || "sold"
      };
    });

    res.status(200).json({ success: true, nfts: formatted });
  } catch (err) {
    console.error("[Collectible] getMyCollection error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Any User's Collection ────────────────────────────────────────────────

/**
 * GET /api/nft/user/:userId/collection
 */
const getUserCollection = async (req, res) => {
  const { userId } = req.params;

  try {
    const ownerships = await CollectibleOwnership.find({ toUserId: userId })
      .populate({
        path: "auctionId",
        select: "title description mediaUrl mediaType highestBid creator",
        populate: { path: "creator", select: "name handle avatar" }
      })
      .populate({
        path: "postId",
        select: "title caption thumbnail media creator nftPriceINR status",
        populate: { path: "creator", select: "name handle avatar" }
      })
      .sort({ createdAt: -1 });

    const formatted = ownerships.map((o) => {
      const source = o.auctionId || o.postId;
      return {
        collectibleId: o.collectibleId,
        title: source?.title || source?.caption || "Untitled Collectible",
        mediaUrl: source?.mediaUrl || source?.media?.url || source?.thumbnail || "",
        mediaType: source?.mediaType || source?.media?.type || "image",
        salePrice: o.salePrice,
        acquiredAt: o.createdAt,
      };
    });

    res.status(200).json({ success: true, nfts: formatted });
  } catch (err) {
    console.error("[Collectible] getUserCollection error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get NFT Detail ────────────────────────────────────────────────────────────

/**
 * GET /api/nft/:auctionId
 * Returns details about a collectible/auction including ownership history.
 */
const getNFTDetail = async (req, res) => {
  const { tokenId: auctionId } = req.params; // tokenId param is now auctionId for backward compat

  try {
    const auction = await Auction.findById(auctionId)
      .populate("creator", "name handle avatar countryCode")
      .populate("winner", "name handle avatar");

    if (!auction) {
      return res.status(404).json({ success: false, message: "Collectible not found." });
    }

    const ownershipHistory = await CollectibleOwnership.find({ auctionId })
      .populate("fromUserId", "name handle avatar")
      .populate("toUserId", "name handle avatar")
      .sort({ createdAt: 1 });

    const currentOwnership = ownershipHistory[ownershipHistory.length - 1];

    const nft = {
      auctionId: auction._id,
      collectibleId: currentOwnership?.collectibleId || null,
      royaltyPct: auction.royaltyPct || 10,
      auction: {
        title: auction.title,
        description: auction.description,
        mediaUrl: auction.mediaUrl,
        mediaType: auction.mediaType,
        highestBid: auction.highestBid,
        status: auction.status,
        creator: auction.creator,
        winner: auction.winner,
      },
      currentOwner: currentOwnership?.toUserId || auction.winner || null,
      certificateUrl: currentOwnership?.certificateUrl || null,
    };

    const historyFormatted = ownershipHistory.map((o) => ({
      transferType: o.transferType,
      fromUser: o.fromUserId,
      toUser: o.toUserId,
      salePrice: o.salePrice,
      createdAt: o.createdAt,
    }));

    res.status(200).json({ success: true, nft, ownershipHistory: historyFormatted });
  } catch (err) {
    console.error("[Collectible] getNFTDetail error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Marketplace ───────────────────────────────────────────────────────────

/**
 * GET /api/nft/marketplace
 * Returns all live and ended auctions that have an NFT post linked.
 */
const getMarketplace = async (req, res) => {
  const { mediaType } = req.query;

  try {
    const filter = { status: { $in: ["live", "ended"] } };
    if (mediaType && mediaType !== "all") {
      filter.mediaType = mediaType;
    }

    const auctions = await Auction.find(filter)
      .populate("creator", "name handle avatar")
      .populate("winner", "name handle avatar")
      .sort({ createdAt: -1 })
      .limit(100);

    const nfts = auctions.map((a) => ({
      tokenId: a._id, // use _id as tokenId for backward compat URLs
      auctionId: a._id,
      title: a.title,
      description: a.description,
      mediaUrl: a.mediaUrl,
      mediaType: a.mediaType,
      highestBid: a.highestBid,
      basePrice: a.basePrice,
      status: a.status,
      creator: a.creator,
    }));

    res.status(200).json({ success: true, nfts });
  } catch (err) {
    console.error("[Collectible] getMarketplace error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Buy Collectible ────────────────────────────────────────────────────────────

/**
 * POST /api/nft/buy/:auctionId
 * Deducts coins from the winning user's recharge wallet and creates a
 * CollectibleOwnership record. Only the auction winner can call this.
 */
const buyCollectible = async (req, res) => {
  const buyerId = req.user.userId;
  const { auctionId } = req.params;

  try {
    const auction = await Auction.findById(auctionId).populate("winner");
    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found." });
    }
    if (auction.status !== "ended") {
      return res.status(400).json({ success: false, message: "Auction has not ended yet." });
    }
    if (String(auction.winner?._id) !== String(buyerId)) {
      return res.status(403).json({ success: false, message: "Only the auction winner can claim this collectible." });
    }

    // Check if already claimed
    const existing = await CollectibleOwnership.findOne({ auctionId });
    if (existing) {
      return res.status(400).json({ success: false, message: "This collectible has already been claimed." });
    }

    const buyer = await User.findById(buyerId);
    const price = auction.highestBid;
    if (buyer.rechargeCoins < price) {
      return res.status(400).json({ success: false, message: "Insufficient coin balance to claim this collectible." });
    }

    // Deduct coins from buyer
    buyer.rechargeCoins -= price;
    await buyer.save();

    // Credit coins to creator (minus platform commission)
    const commissionPct = auction.commissionPct || 0;
    const creatorShare = Math.round(price * (100 - commissionPct) / 100);
    await User.findByIdAndUpdate(auction.creator, { $inc: { earningCoins: creatorShare } });

    // Create ownership record
    const collectibleId = await generateCollectibleId();
    const ownership = await CollectibleOwnership.create({
      auctionId,
      collectibleId,
      fromUserId: null,
      toUserId: buyerId,
      salePrice: price,
      transferType: "initial_sale",
    });

    // Mark auction as settled
    auction.nftStatus = "settled";
    await auction.save();

    res.status(200).json({
      success: true,
      message: "Collectible claimed successfully!",
      collectibleId,
      ownership,
    });
  } catch (err) {
    console.error("[Collectible] buyCollectible error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Buy Post NFT ──────────────────────────────────────────────────────────────

/**
 * POST /api/nft/buy-post/:postId
 * Buys a Post that is listed as an NFT directly.
 */
const buyPostNFT = async (req, res) => {
  const buyerId = req.user.userId;
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }
    if (!post.isNFT) {
      return res.status(400).json({ success: false, message: "This post is not listed as an NFT." });
    }
    if (post.status !== "approved") {
      return res.status(400).json({ success: false, message: "This NFT post is not available for purchase." });
    }
    // Temporarily allow buying own NFT for testing purposes
    // if (String(post.creator._id) === String(buyerId)) {
    //   return res.status(400).json({ success: false, message: "You cannot buy your own NFT." });
    // }

    const buyer = await User.findById(buyerId);
    const price = post.nftPriceINR;
    if (buyer.rechargeCoins < price) {
      return res.status(400).json({ success: false, message: "Insufficient coin balance to purchase this NFT." });
    }

    // Deduct coins from buyer
    buyer.rechargeCoins -= price;
    await buyer.save();

    // Credit coins to creator (minus platform commission)
    const commissionPct = 5; // Standard 5% commission, adjustable via PlatformSettings if needed
    const creatorShare = Math.round(price * (100 - commissionPct) / 100);
    await User.findByIdAndUpdate(post.creator._id, { $inc: { earningCoins: creatorShare } });

    // Create ownership record
    const collectibleId = await generateCollectibleId();
    const ownership = await CollectibleOwnership.create({
      postId: post._id,
      collectibleId,
      fromUserId: post.creator._id,
      toUserId: buyerId,
      salePrice: price,
      transferType: "initial_sale",
    });

    // Mark post as sold and update owner
    post.status = "sold";
    post.owner = buyerId;
    await post.save();

    res.status(200).json({
      success: true,
      message: "NFT purchased successfully!",
      post,
      collectibleId,
      ownership,
    });
  } catch (err) {
    console.error("[Collectible] buyPostNFT error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Ownership Certificate ─────────────────────────────────────────────────

/**
 * GET /api/nft/certificate/:auctionId
 * Returns ownership certificate details for a collectible.
 */
const getOwnershipCertificate = async (req, res) => {
  const { auctionId } = req.params;
  const userId = req.user.userId;

  try {
    const ownership = await CollectibleOwnership.findOne({ auctionId, toUserId: userId })
      .populate({ path: "auctionId", select: "title creator mediaUrl", populate: { path: "creator", select: "name handle" } })
      .populate("toUserId", "name handle avatar");

    if (!ownership) {
      return res.status(404).json({ success: false, message: "You do not own this collectible." });
    }

    res.status(200).json({
      success: true,
      certificate: {
        collectibleId: ownership.collectibleId,
        title: ownership.auctionId?.title,
        creator: ownership.auctionId?.creator,
        owner: ownership.toUserId,
        mediaUrl: ownership.auctionId?.mediaUrl,
        salePrice: ownership.salePrice,
        acquiredAt: ownership.createdAt,
        certificateUrl: ownership.certificateUrl || null,
      },
    });
  } catch (err) {
    console.error("[Collectible] getOwnershipCertificate error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Migration: Convert old NFTOwnership records ─────────────────────────────

/**
 * POST /api/nft/admin/migrate
 * One-time migration script to convert NFTOwnership records to CollectibleOwnership.
 */
const migrateNFTOwnerships = async (req, res) => {
  try {
    // Dynamically require old model for migration only
    let NFTOwnership;
    try {
      NFTOwnership = require("../models/NFTOwnership");
    } catch (e) {
      return res.status(200).json({ success: true, message: "NFTOwnership model not found, nothing to migrate." });
    }

    const oldRecords = await NFTOwnership.find({});
    let migrated = 0;

    for (const record of oldRecords) {
      const alreadyMigrated = await CollectibleOwnership.findOne({ auctionId: record.auctionId });
      if (alreadyMigrated) continue;

      const collectibleId = await generateCollectibleId();
      await CollectibleOwnership.create({
        auctionId: record.auctionId,
        collectibleId,
        fromUserId: record.fromUserId || null,
        toUserId: record.toUserId || null,
        salePrice: record.salePrice || 0,
        transferType: record.transferType === "mint" ? "initial_sale" : "resale",
      });
      migrated++;
    }

    res.status(200).json({ success: true, message: `Migration complete. ${migrated} records migrated.` });
  } catch (err) {
    console.error("[Collectible] migration error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── processVaultSettlements (stub — no-op in Web2, kept for app.js compat) ──
const processVaultSettlements = async () => {
  // No-op: blockchain settlement removed. Coin-based settlement is instant.
};

module.exports = {
  getMyCollection,
  getUserCollection,
  getNFTDetail,
  getMarketplace,
  buyCollectible,
  buyPostNFT,
  getOwnershipCertificate,
  migrateNFTOwnerships,
  processVaultSettlements,
};

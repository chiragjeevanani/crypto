const Auction = require("../models/Auction");
const Post = require("../models/Post");
const User = require("../models/User");
const AdminConfig = require("../models/AdminConfig");
const CollectibleOwnership = require("../models/CollectibleOwnership");
const NFTOffer = require("../models/NFTOffer");
const WalletTransaction = require("../models/WalletTransaction");
const { emitToUser } = require("../utils/socket");
const { DEFAULTS } = require("../utils/adminConfig");
const { UPLOAD_DIR } = require("../utils/upload");
const { generateCertificate } = require("../utils/pdfGenerator");
const { sendCertificateEmail } = require("../utils/mailer");

// ─── Helper: Generate Platform Collectible ID ────────────────────────────────
const generateCollectibleId = async () => {
  const year = new Date().getFullYear();
  const count = await CollectibleOwnership.countDocuments();
  return `KNQ-${year}-${String(count + 1).padStart(4, "0")}`;
};

// ─── Helper: Extract Media ─────────────────────────────────────────────────────
const getMediaUrl = (source, req) => {
  let url = "";
  if (source?.mediaUrl) url = source.mediaUrl;
  else if (Array.isArray(source?.media) && source.media.length > 0) url = source.media[0].url;
  else if (source?.media && !Array.isArray(source?.media) && source.media.url) url = source.media.url;
  else url = source?.thumbnail || "";

  if (url && (url.startsWith("/uploads") || url.startsWith("/avatars"))) {
    if (req) {
      const protocol = req.protocol;
      const host = req.get("host");
      return `${protocol}://${host}${url}`;
    }
    return `http://localhost:5000${url}`;
  }
  return url;
};

const getMediaType = (source) => {
  if (source?.mediaType) return source.mediaType;
  if (Array.isArray(source?.media) && source.media.length > 0) return source.media[0].type;
  if (source?.media && !Array.isArray(source?.media) && source.media.type) return source.media.type;
  return "image";
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
        select: "title caption thumbnail media creator nftPriceINR status totalCopies copiesSold",
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
        mediaUrl: getMediaUrl(source, req),
        mediaType: getMediaType(source),
        salePrice: o.salePrice,
        certificateUrl: o.certificateUrl,
        isListedForSale: o.isListedForSale,
        resalePrice: o.resalePrice,
        acquiredAt: o.createdAt,
        creator: source?.creator || null,
        status: source?.status || source?.nftStatus || "sold",
        totalCopies: o.totalCopies || source?.totalCopies || 1,
        copiesSold: source?.copiesSold || 0,
        copyNumber: o.copyNumber || 1
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
        select: "title caption thumbnail media creator nftPriceINR status totalCopies copiesSold",
        populate: { path: "creator", select: "name handle avatar" }
      })
      .sort({ createdAt: -1 });

    const formatted = ownerships.map((o) => {
      const source = o.auctionId || o.postId;
      return {
        collectibleId: o.collectibleId,
        title: source?.title || source?.caption || "Untitled Collectible",
        mediaUrl: getMediaUrl(source, req),
        mediaType: getMediaType(source),
        salePrice: o.salePrice,
        isListedForSale: o.isListedForSale,
        resalePrice: o.resalePrice,
        acquiredAt: o.createdAt,
        creator: source?.creator || null,
        totalCopies: o.totalCopies || source?.totalCopies || 1,
        copiesSold: source?.copiesSold || 0,
        copyNumber: o.copyNumber || 1
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
        mediaUrl: getMediaUrl(auction, req),
        mediaType: getMediaType(auction),
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
      mediaUrl: getMediaUrl(a, req),
      mediaType: getMediaType(a),
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

// ─── Get Resale Listings ───────────────────────────────────────────────────────

/**
 * GET /api/nft/resale-listings
 * Returns all collectibles currently listed for fixed-price resale.
 */
const getResaleListings = async (req, res) => {
  try {
    const ownerships = await CollectibleOwnership.find({ isListedForSale: true })
      .populate({
        path: "auctionId",
        select: "title description mediaUrl mediaType highestBid creator",
        populate: { path: "creator", select: "name handle avatar" }
      })
      .populate({
        path: "postId",
        select: "title caption thumbnail media creator nftPriceINR status totalCopies copiesSold",
        populate: { path: "creator", select: "name handle avatar" }
      })
      .populate("toUserId", "name handle avatar")
      .sort({ updatedAt: -1 });

    const formatted = ownerships.map((o) => {
      const source = o.auctionId || o.postId;
      return {
        collectibleId: o.collectibleId,
        title: source?.title || source?.caption || "Untitled Collectible",
        mediaUrl: getMediaUrl(source),
        mediaType: getMediaType(source),
        resalePrice: o.resalePrice,
        isListedForSale: o.isListedForSale,
        acquiredAt: o.createdAt,
        owner: o.toUserId,
        creator: source?.creator || null,
        totalCopies: o.totalCopies || source?.totalCopies || 1,
        copiesSold: source?.copiesSold || 0,
        copyNumber: o.copyNumber || 1
      };
    });

    res.status(200).json({ success: true, nfts: formatted });
  } catch (err) {
    console.error("[Collectible] getResaleListings error:", err);
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
    const buyerBefore = buyer.rechargeCoins;
    buyer.rechargeCoins -= price;
    await buyer.save();

    // Credit coins to creator (minus platform commission)
    const commissionPct = auction.commissionPct || 0;
    const creatorShare = Math.round(price * (100 - commissionPct) / 100);
    const creatorUser = await User.findById(auction.creator);
    const creatorBefore = creatorUser ? (creatorUser.earningCoins || 0) : 0;
    await User.findByIdAndUpdate(auction.creator, { $inc: { earningCoins: creatorShare } });

    // Record transactions
    await WalletTransaction.create([
      {
        userId: buyerId,
        type: "withdrawal",
        coins: price,
        amount: price,
        beforeBalance: buyerBefore,
        afterBalance: buyer.rechargeCoins,
        referenceId: auctionId,
        referenceType: "auction_purchase",
        status: "success",
        meta: { title: "Claim Collectible" }
      },
      {
        userId: auction.creator,
        type: "deposit",
        coins: creatorShare,
        amount: creatorShare,
        beforeBalance: creatorBefore,
        afterBalance: creatorBefore + creatorShare,
        referenceId: auctionId,
        referenceType: "auction_sale",
        status: "success",
        meta: { title: "Collectible Auction Payout" }
      }
    ]);

    // Create ownership record
    const collectibleId = await generateCollectibleId();
    const ownership = await CollectibleOwnership.create({
      auctionId,
      collectibleId,
      fromUserId: null,
      toUserId: buyerId,
      salePrice: price,
      transferType: "initial_sale",
      copyNumber: 1,
      totalCopies: 1,
    });

    try {
      const pdfBuffer = await generateCertificate({
        ownerName: buyer.name,
        sellerName: auction.creator?.name || 'Unknown Seller',
        title: auction.title,
        copyNumber: 1,
        totalCopies: 1,
        date: new Date()
      });
      if (buyer.email) {
        sendCertificateEmail(buyer.email, pdfBuffer, auction.title);
      }
    } catch (certErr) {
      console.error("Certificate Generation/Email Failed:", certErr);
    }

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

    if (post.copiesSold >= post.totalCopies) {
      return res.status(400).json({ success: false, message: "All copies of this NFT have been sold." });
    }

    // Deduct coins from buyer
    const buyerBefore = buyer.rechargeCoins;
    buyer.rechargeCoins -= price;
    await buyer.save();

    post.copiesSold += 1;
    const currentCopy = post.copiesSold;

    // Credit coins to creator (minus platform commission)
    const commissionPct = 5; // Standard 5% commission, adjustable via PlatformSettings if needed
    const creatorShare = Math.round(price * (100 - commissionPct) / 100);
    let creatorBefore = 0;
    if (post.creator && post.creator._id) {
      creatorBefore = Number(post.creator.earningCoins || 0);
      await User.findByIdAndUpdate(post.creator._id, { $inc: { earningCoins: creatorShare } });
    }

    // Record transactions
    const walletTransactions = [
      {
        userId: buyerId,
        type: "withdrawal",
        coins: price,
        amount: price,
        beforeBalance: buyerBefore,
        afterBalance: buyer.rechargeCoins,
        referenceId: post._id,
        referenceType: "nft_purchase",
        status: "success",
        meta: { title: `Buy NFT: ${post.caption || 'No Caption'}` }
      }
    ];

    if (post.creator && post.creator._id) {
      walletTransactions.push({
        userId: post.creator._id,
        type: "deposit",
        coins: creatorShare,
        amount: creatorShare,
        beforeBalance: creatorBefore,
        afterBalance: creatorBefore + creatorShare,
        referenceId: post._id,
        referenceType: "nft_sale",
        status: "success",
        meta: { title: `NFT Sale: ${post.caption || 'No Caption'}` }
      });
    }

    await WalletTransaction.create(walletTransactions);

    // Create ownership record
    const collectibleId = await generateCollectibleId();
    const ownership = await CollectibleOwnership.create({
      postId: post._id,
      collectibleId,
      fromUserId: post.creator ? post.creator._id : null,
      toUserId: buyerId,
      salePrice: price,
      transferType: "initial_sale",
      copyNumber: currentCopy,
      totalCopies: post.totalCopies,
    });

    try {
      const pdfBuffer = await generateCertificate({
        ownerName: buyer.name,
        sellerName: post.creator?.name || 'Unknown Creator',
        title: post.caption || post.title || "NFT Post",
        copyNumber: currentCopy,
        totalCopies: post.totalCopies,
        date: new Date()
      });
      if (buyer.email) {
        sendCertificateEmail(buyer.email, pdfBuffer, post.caption || post.title || "NFT Post");
      }
    } catch (certErr) {
      console.error("Certificate Generation/Email Failed:", certErr);
    }

    // Mark post as sold and update owner only if all copies are sold
    if (post.copiesSold >= post.totalCopies) {
      post.status = "sold";
    }
    // Note: We don't change post.owner directly if it's a multi-copy NFT, but for backward compatibility,
    // if there's only 1 copy or all copies are sold, we might set the last buyer as owner. Let's just set it.
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

// ─── Get NFT Terms & Conditions ───────────────────────────────────────────────

/**
 * GET /api/nft/terms
 * Returns admin-managed NFT submission terms and conditions.
 */
const getNFTTerms = async (req, res) => {
  try {
    let config = await AdminConfig.findOne().exec();
    const terms = config?.nftTermsAndConditions || DEFAULTS.nftTermsAndConditions || "Please contact the platform admin for terms and conditions.";
    res.status(200).json({ success: true, terms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── User Submit NFT ──────────────────────────────────────────────────────────

/**
 * POST /api/nft/submit
 * Allows authenticated users to submit an NFT (image/video/audio).
 * Creates an Auction record with status=pending for admin review.
 */
const submitNFT = async (req, res) => {
  const userId = req.user.userId;
  const { title, description, basePrice, royaltyPct, termsAccepted } = req.body;

  if (!termsAccepted || termsAccepted === 'false') {
    return res.status(400).json({ success: false, message: "You must accept the terms and conditions to submit an NFT." });
  }

  if (!title || !description || !basePrice) {
    return res.status(400).json({ success: false, message: "Title, description, and base price are required." });
  }

  try {
    const files = req.files || {};
    const mediaFile = files.media ? files.media[0] : null;
    const proofVideoFile = files.proofVideo ? files.proofVideo[0] : null;

    if (!mediaFile) {
      return res.status(400).json({ success: false, message: "Please upload a media file (image, video, or audio)." });
    }

    let mediaUrl = "";
    let mediaType = "image";
    let proofVideoUrl = "";

    if (mediaFile.mimetype.startsWith("video/")) mediaType = "video";
    else if (mediaFile.mimetype.startsWith("audio/")) mediaType = "audio";
    else mediaType = "image";

    mediaUrl = `/uploads/${mediaFile.filename}`;
    if (proofVideoFile) proofVideoUrl = `/uploads/${proofVideoFile.filename}`;

    // Use sensible auction dates: starts now, ends in 7 days by default
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const auction = await Auction.create({
      title,
      description,
      mediaUrl,
      mediaType,
      proofVideoUrl,
      basePrice: Number(basePrice),
      startDate,
      endDate,
      creator: userId,
      status: "pending",
      listingFeePaid: true,
      royaltyPct: Number(royaltyPct) || 10,
    });

    res.status(201).json({
      success: true,
      message: "Your NFT has been submitted for review. Once admin verifies it, it will go live in the marketplace.",
      auction,
    });
  } catch (err) {
    console.error("[SubmitNFT] Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Resale & Offers ────────────────────────────────────────────────────────────

const relistNFT = async (req, res) => {
  const userId = req.user.userId;
  const { collectibleId } = req.params;
  const { price } = req.body;

  try {
    const ownership = await CollectibleOwnership.findOne({ collectibleId }).sort({ createdAt: -1 });
    if (!ownership) return res.status(404).json({ success: false, message: "Collectible not found." });
    if (String(ownership.toUserId) !== String(userId)) return res.status(403).json({ success: false, message: "You do not own this collectible." });

    ownership.isListedForSale = true;
    ownership.resalePrice = Number(price);
    await ownership.save();

    res.status(200).json({ success: true, message: "NFT relisted successfully.", ownership });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const buyResaleNFT = async (req, res) => {
  const buyerId = req.user.userId;
  const { collectibleId } = req.params;

  try {
    const ownership = await CollectibleOwnership.findOne({ collectibleId, isListedForSale: true }).sort({ createdAt: -1 }).populate("auctionId postId");
    if (!ownership) return res.status(404).json({ success: false, message: "Collectible is not listed for sale." });
    if (String(ownership.toUserId) === String(buyerId)) return res.status(400).json({ success: false, message: "You already own this NFT." });

    const buyer = await User.findById(buyerId);
    const sellerId = ownership.toUserId;
    const price = ownership.resalePrice;

    if (buyer.rechargeCoins < price) return res.status(400).json({ success: false, message: "Insufficient balance." });

    // Deduct from buyer
    const buyerBefore = buyer.rechargeCoins;
    buyer.rechargeCoins -= price;
    await buyer.save();

    // Royalty & Commission logic
    const auction = ownership.auctionId || {};
    const post = ownership.postId || {};
    const creatorId = auction.creator || post.creator;
    const royaltyPct = auction.royaltyPct || post.royaltyPct || 10;
    
    // Simplification: platform takes 5% commission on resale, creator takes royalty
    const commission = price * 0.05;
    const royalty = Math.round(price * (royaltyPct / 100));
    const sellerEarning = Math.round(price - commission - royalty);

    const sellerUser = await User.findById(sellerId);
    const sellerBefore = sellerUser ? (sellerUser.earningCoins || 0) : 0;
    await User.findByIdAndUpdate(sellerId, { $inc: { earningCoins: sellerEarning } });

    const actualCreatorId = creatorId ? (creatorId._id || creatorId) : null;
    let creatorBefore = 0;
    if (actualCreatorId) {
      const creatorUser = await User.findById(actualCreatorId);
      creatorBefore = creatorUser ? (creatorUser.earningCoins || 0) : 0;
      await User.findByIdAndUpdate(actualCreatorId, { $inc: { earningCoins: royalty } });
    }

    // Record transactions
    const title = auction.title || post.title || post.caption || "NFT Post";
    const walletTransactions = [
      {
        userId: buyerId,
        type: "withdrawal",
        coins: price,
        amount: price,
        beforeBalance: buyerBefore,
        afterBalance: buyer.rechargeCoins,
        referenceId: post._id || auction._id || collectibleId,
        referenceType: "nft_purchase",
        status: "success",
        meta: { title: `Buy Resale NFT: ${title}` }
      },
      {
        userId: sellerId,
        type: "deposit",
        coins: sellerEarning,
        amount: sellerEarning,
        beforeBalance: sellerBefore,
        afterBalance: sellerBefore + sellerEarning,
        referenceId: post._id || auction._id || collectibleId,
        referenceType: "nft_sale",
        status: "success",
        meta: { title: `Resale NFT Sold: ${title}` }
      }
    ];

    if (actualCreatorId) {
      walletTransactions.push({
        userId: actualCreatorId,
        type: "deposit",
        coins: royalty,
        amount: royalty,
        beforeBalance: creatorBefore,
        afterBalance: creatorBefore + royalty,
        referenceId: post._id || auction._id || collectibleId,
        referenceType: "nft_royalty",
        status: "success",
        meta: { title: `NFT Royalty: ${title}` }
      });
    }

    await WalletTransaction.create(walletTransactions);

    // Update ownership
    ownership.isListedForSale = false;
    ownership.fromUserId = sellerId;
    ownership.toUserId = buyerId;
    ownership.salePrice = price;
    ownership.transferType = "resale";
    await ownership.save();

    try {
      const seller = await User.findById(sellerId);
      const pdfBuffer = await generateCertificate({
        ownerName: buyer.name,
        sellerName: seller?.name || 'Unknown Seller',
        title: auction.title || post.title || post.caption || "NFT Post",
        copyNumber: ownership.copyNumber || 1,
        totalCopies: ownership.totalCopies || 1,
        date: new Date()
      });
      if (buyer.email) {
        sendCertificateEmail(buyer.email, pdfBuffer, auction.title || post.title || post.caption || "NFT Post");
      }
    } catch (certErr) {
      console.error("Certificate Generation/Email Failed:", certErr);
    }

    res.status(200).json({ success: true, message: "NFT purchased successfully.", ownership });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const placeOffer = async (req, res) => {
  const bidderId = req.user.userId;
  const { collectibleId } = req.params;
  const { amount } = req.body;

  try {
    const ownership = await CollectibleOwnership.findOne({ collectibleId }).sort({ createdAt: -1 });
    if (!ownership) return res.status(404).json({ success: false, message: "Collectible not found." });
    if (String(ownership.toUserId) === String(bidderId)) return res.status(400).json({ success: false, message: "You own this NFT." });

    const existingOffer = await NFTOffer.findOne({ collectibleId, bidderId, status: "pending" });
    if (existingOffer) return res.status(400).json({ success: false, message: "You already have a pending offer on this NFT." });

    const bidder = await User.findById(bidderId);
    if (bidder.rechargeCoins < amount) return res.status(400).json({ success: false, message: "Insufficient balance to place this offer." });

    // Lock coins
    bidder.rechargeCoins -= amount;
    await bidder.save();

    const offer = await NFTOffer.create({
      collectibleId,
      bidderId,
      ownerId: ownership.toUserId,
      offerAmount: amount,
      status: "pending"
    });

    // Notify the owner instantly via Socket.io
    emitToUser(ownership.toUserId, "new_nft_offer", {
      collectibleId,
      offerAmount: amount,
      bidderId,
      offerId: offer._id
    });

    res.status(200).json({ success: true, message: "Offer placed successfully.", offer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const acceptOffer = async (req, res) => {
  const userId = req.user.userId;
  const { collectibleId, offerId } = req.params;

  try {
    const ownership = await CollectibleOwnership.findOne({ collectibleId }).sort({ createdAt: -1 }).populate("auctionId postId");
    if (!ownership) return res.status(404).json({ success: false, message: "Collectible not found." });
    if (String(ownership.toUserId) !== String(userId)) return res.status(403).json({ success: false, message: "You do not own this NFT." });

    const offer = await NFTOffer.findOne({ _id: offerId, collectibleId, status: "pending" });
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found or already processed." });

    const price = offer.offerAmount;

    // Distribute funds (already deducted from bidder)
    const auction = ownership.auctionId || {};
    const post = ownership.postId || {};
    const creatorId = auction.creator || post.creator;
    const royaltyPct = auction.royaltyPct || post.royaltyPct || 10;
    
    const commission = price * 0.05;
    const royalty = price * (royaltyPct / 100);
    const sellerEarning = price - commission - royalty;

    await User.findByIdAndUpdate(userId, { $inc: { earningCoins: sellerEarning } });
    if (creatorId) {
      await User.findByIdAndUpdate(creatorId, { $inc: { earningCoins: royalty } });
    }

    offer.status = "accepted";
    await offer.save();

    ownership.isListedForSale = false;
    ownership.fromUserId = userId;
    ownership.toUserId = offer.bidderId;
    ownership.salePrice = price;
    ownership.transferType = "resale";
    await ownership.save();

    // Refund other pending offers
    const otherOffers = await NFTOffer.find({ collectibleId, status: "pending" });
    for (const other of otherOffers) {
      await User.findByIdAndUpdate(other.bidderId, { $inc: { rechargeCoins: other.offerAmount } });
      other.status = "rejected";
      await other.save();
    }

    res.status(200).json({ success: true, message: "Offer accepted successfully.", ownership });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const cancelOffer = async (req, res) => {
  const bidderId = req.user.userId;
  const { collectibleId, offerId } = req.params;

  try {
    const offer = await NFTOffer.findOne({ _id: offerId, collectibleId, bidderId, status: "pending" });
    if (!offer) return res.status(404).json({ success: false, message: "Pending offer not found." });

    // Refund locked coins
    await User.findByIdAndUpdate(bidderId, { $inc: { rechargeCoins: offer.offerAmount } });

    offer.status = "cancelled";
    await offer.save();

    res.status(200).json({ success: true, message: "Offer cancelled. Coins refunded." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Offers ───────────────────────────────────────────────────────────────
const getOffersForCollectible = async (req, res) => {
  const { collectibleId } = req.params;
  try {
    const offers = await NFTOffer.find({ collectibleId, status: "pending" })
      .populate("bidderId", "name handle avatar")
      .sort({ offerAmount: -1 });
    res.status(200).json({ success: true, offers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyOffers = async (req, res) => {
  const userId = req.user.userId;
  try {
    const offers = await NFTOffer.find({ bidderId: userId, status: "pending" })
      .populate("ownerId", "name handle avatar")
      .sort({ createdAt: -1 });
    
    // Populate the collectible details to show which NFT it is
    const populatedOffers = await Promise.all(offers.map(async (offer) => {
      const ownership = await CollectibleOwnership.findOne({ collectibleId: offer.collectibleId })
        .populate("auctionId", "title mediaUrl")
        .populate("postId", "title caption media thumbnail");
      
      const source = ownership?.auctionId || ownership?.postId;
      return {
        ...offer._doc,
        nft: {
          title: source?.title || source?.caption || "Untitled NFT",
          mediaUrl: getMediaUrl(source),
          mediaType: getMediaType(source),
          collectibleId: offer.collectibleId,
          resalePrice: ownership?.resalePrice || source?.nftPriceINR || source?.highestBid || 0
        }
      };
    }));

    res.status(200).json({ success: true, offers: populatedOffers });
  } catch (err) {
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
  relistNFT,
  buyResaleNFT,
  placeOffer,
  acceptOffer,
  cancelOffer,
  getOffersForCollectible,
  getMyOffers,
  getResaleListings,
  submitNFT,
  getNFTTerms
};

const Auction = require("../models/Auction");
const User = require("../models/User");
const axios = require("axios");
const NFTOwnership = require("../models/NFTOwnership");
const { prepareAuctionForIPFS, ipfsToGatewayUrl } = require("../services/ipfsService");
const { mintNFT, settleAuctionOnChain, getTokenOwner, verifyTransaction, getTxExplorerUrl, getOpenSeaUrl, sponsorDepositBid } = require("../services/web3Service");
const KycSubmission = require("../models/KycSubmission");

// ─── Link Wallet ──────────────────────────────────────────────────────────────

/**
 * POST /api/nft/wallet/link
 * User links their MetaMask wallet address to their platform account.
 * The frontend sends the wallet address after the user connects MetaMask.
 */
const linkWallet = async (req, res) => {
  const userId = req.user.userId;
  const { walletAddress } = req.body;

  try {
    if (!walletAddress || !walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return res.status(400).json({ success: false, message: "Invalid wallet address format." });
    }

    const normalized = walletAddress.toLowerCase();

    // Check if wallet is already used by another account
    const existing = await User.findOne({ walletAddress: normalized, _id: { $ne: userId } });
    if (existing) {
      return res.status(409).json({ success: false, message: "This wallet is already linked to another account." });
    }

    await User.findByIdAndUpdate(userId, {
      walletAddress: normalized,
      walletVerifiedAt: new Date()
    });

    res.status(200).json({ success: true, message: "Wallet linked successfully.", walletAddress: normalized });
  } catch (err) {
    console.error("[NFT] linkWallet error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get My NFT Collection ────────────────────────────────────────────────────

/**
 * GET /api/nft/my-collection
 * Returns all NFTs owned by the logged-in user (by wallet address).
 */
const getMyCollection = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId).select("walletAddress");
    if (!user?.walletAddress) {
      return res.status(200).json({ success: true, nfts: [], message: "No wallet linked yet." });
    }

    // Get NFTs where the user's wallet is the latest owner
    const ownerships = await NFTOwnership.find({
      toAddress: user.walletAddress.toLowerCase()
    })
      .populate({ path: "auctionId", select: "title description mediaUrl mediaType nftStatus tokenId" })
      .sort({ createdAt: -1 });

    // Filter out NFTs that were transferred away (where a later record exists with this wallet as fromAddress)
    const transferredOut = new Set(
      (await NFTOwnership.find({ fromAddress: user.walletAddress.toLowerCase() }))
        .map((o) => `${o.contractAddress}:${o.tokenId}`)
    );

    const currentNFTs = ownerships.filter(
      (o) => !transferredOut.has(`${o.contractAddress}:${o.tokenId}`)
    );

    const formatted = currentNFTs.map((o) => ({
      tokenId: o.tokenId,
      contractAddress: o.contractAddress,
      auction: o.auctionId,
      acquiredAt: o.createdAt,
      platform: o.platform,
      openSeaUrl: getOpenSeaUrl(o.tokenId),
      explorerUrl: getTxExplorerUrl(o.txHash)
    }));

    res.status(200).json({ success: true, nfts: formatted, total: formatted.length });
  } catch (err) {
    console.error("[NFT] getMyCollection error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get NFT Detail (Public) ─────────────────────────────────────────────────

/**
 * GET /api/nft/:tokenId
 * Public endpoint — returns NFT details and full ownership history.
 */
const getNFTDetail = async (req, res) => {
  const { tokenId } = req.params;

  try {
    // Find the auction associated with this tokenId
    const auction = await Auction.findOne({ tokenId: Number(tokenId) })
      .populate("creator", "name handle avatar countryCode")
      .populate("winner", "name handle avatar walletAddress");

    if (!auction) {
      return res.status(404).json({ success: false, message: "NFT not found." });
    }

    // Get ownership history
    const history = await NFTOwnership.find({ tokenId: Number(tokenId) })
      .populate("fromUserId", "name handle avatar")
      .populate("toUserId", "name handle avatar")
      .sort({ createdAt: 1 });

    // Try to get current on-chain owner (live from blockchain)
    let currentOwnerWallet = auction.winnerWalletAddress;
    try {
      if (process.env.ENABLE_WEB3 === "true") {
        currentOwnerWallet = await getTokenOwner(Number(tokenId));
      }
    } catch (_) { /* ignore — use cached value */ }

    res.status(200).json({
      success: true,
      nft: {
        tokenId: auction.tokenId,
        contractAddress: auction.contractAddress,
        ipfsMetadataUri: auction.ipfsMetadataUri,
        ipfsFileUri: auction.ipfsFileUri,
        metadataGatewayUrl: ipfsToGatewayUrl(auction.ipfsMetadataUri),
        fileGatewayUrl: ipfsToGatewayUrl(auction.ipfsFileUri),
        mintTxHash: auction.mintTxHash,
        explorerUrl: getTxExplorerUrl(auction.mintTxHash),
        openSeaUrl: getOpenSeaUrl(auction.tokenId),
        royaltyPct: auction.royaltyPct,
        currentOwnerWallet,
        auction: {
          id: auction._id,
          title: auction.title,
          description: auction.description,
          mediaUrl: auction.mediaUrl,
          mediaType: auction.mediaType,
          creator: auction.creator,
          winner: auction.winner,
          highestBid: auction.highestBid
        }
      },
      ownershipHistory: history
    });
  } catch (err) {
    console.error("[NFT] getNFTDetail error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get All Minted NFTs (Marketplace) ───────────────────────────────────────

/**
 * GET /api/nft/marketplace
 * Public endpoint — returns all minted NFTs for the marketplace page.
 */
const getMarketplace = async (req, res) => {
  try {
    const { mediaType, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = { nftStatus: "minted" };
    if (mediaType) query.mediaType = mediaType;

    const [auctions, total] = await Promise.all([
      Auction.find(query)
        .populate("creator", "name handle avatar countryCode countryName")
        .populate("winner", "name handle walletAddress")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Auction.countDocuments(query)
    ]);

    const nfts = auctions.map((a) => ({
      tokenId: a.tokenId,
      contractAddress: a.contractAddress,
      title: a.title,
      description: a.description,
      mediaUrl: a.mediaUrl,
      mediaType: a.mediaType,
      ipfsFileUri: a.ipfsFileUri,
      fileGatewayUrl: ipfsToGatewayUrl(a.ipfsFileUri),
      royaltyPct: a.royaltyPct,
      creator: a.creator,
      currentOwner: a.winner,
      highestBid: a.highestBid,
      openSeaUrl: getOpenSeaUrl(a.tokenId),
      mintTxHash: a.mintTxHash,
      auctionId: a._id
    }));

    res.status(200).json({ success: true, nfts, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error("[NFT] getMarketplace error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: Prepare IPFS (Upload to IPFS) ────────────────────────────────────

/**
 * POST /api/nft/admin/prepare/:auctionId
 * Admin triggers IPFS upload for a completed auction.
 * Pins the media file and metadata JSON to IPFS via Pinata.
 */
const prepareIPFS = async (req, res) => {
  const { auctionId } = req.params;

  try {
    const auction = await Auction.findById(auctionId)
      .populate("creator", "name handle avatar countryCode countryName walletAddress");

    if (!auction) return res.status(404).json({ success: false, message: "Auction not found." });
    if (auction.status !== "ended") {
      return res.status(400).json({ success: false, message: "Auction must be ended before IPFS upload." });
    }
    if (!auction.winner) {
      return res.status(400).json({ success: false, message: "Auction has no winner." });
    }
    if (auction.nftStatus === "minted") {
      return res.status(400).json({ success: false, message: "NFT already minted." });
    }

    // Check creator KYC (Indian creators must be verified)
    const creator = await User.findById(auction.creator._id);
    if (creator?.countryCode === "IN" && creator.kycStatus !== "verified") {
      return res.status(403).json({
        success: false,
        message: "Creator's KYC is not verified. NFT minting requires verified identity."
      });
    }

    // Update status to pending
    auction.nftStatus = "pending_ipfs";
    await auction.save();

    // Trigger IPFS upload
    const { ipfsFileUri, ipfsMetadataUri } = await prepareAuctionForIPFS(auction);

    // Update auction with IPFS URIs
    auction.ipfsFileUri = ipfsFileUri;
    auction.ipfsMetadataUri = ipfsMetadataUri;
    auction.nftStatus = "ipfs_ready";
    await auction.save();

    res.status(200).json({
      success: true,
      message: "Media and metadata successfully pinned to IPFS.",
      ipfsFileUri,
      ipfsMetadataUri,
      gatewayUrl: ipfsToGatewayUrl(ipfsMetadataUri)
    });
  } catch (err) {
    console.error("[NFT] prepareIPFS error:", err);
    // Revert status on failure
    await Auction.findByIdAndUpdate(auctionId, { nftStatus: "failed" });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: Mint NFT ──────────────────────────────────────────────────────────

/**
 * POST /api/nft/admin/mint/:auctionId
 * Admin triggers on-chain NFT mint to the winner's wallet.
 * Requires: auction.nftStatus === 'ipfs_ready' and winner has linked wallet.
 */
const mintAuctionNFT = async (req, res) => {
  const { auctionId } = req.params;

  try {
    const auction = await Auction.findById(auctionId)
      .populate("winner", "walletAddress name handle")
      .populate("creator", "walletAddress name handle");

    if (!auction) return res.status(404).json({ success: false, message: "Auction not found." });
    if (auction.nftStatus !== "ipfs_ready") {
      return res.status(400).json({ success: false, message: `Cannot mint: NFT status is '${auction.nftStatus}'. Must be 'ipfs_ready'.` });
    }
    if (!auction.winner?.walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Winner has not linked a wallet. Ask them to connect MetaMask first."
      });
    }
    if (!auction.ipfsMetadataUri) {
      return res.status(400).json({ success: false, message: "IPFS metadata URI is missing. Run prepareIPFS first." });
    }

    // Mark as minting
    auction.nftStatus = "minting";
    auction.winnerWalletAddress = auction.winner.walletAddress;
    auction.creatorWalletAddress = auction.creator?.walletAddress || "";
    await auction.save();

    // Mint on-chain to the VAULT (Vault handles settlement to winner)
    const { txHash, tokenId } = await mintNFT(
      process.env.VAULT_CONTRACT_ADDRESS,
      auction.ipfsMetadataUri,
      auction.royaltyPct,
      auction.creator?.walletAddress || auction.winner.walletAddress // fallback if creator has no wallet
    );

    // Update auction with on-chain data
    auction.nftStatus = "minted";
    auction.tokenId = tokenId;
    auction.contractAddress = process.env.NFT_CONTRACT_ADDRESS;
    auction.mintTxHash = txHash;
    await auction.save();

    // Record initial ownership
    await NFTOwnership.create({
      auctionId: auction._id,
      tokenId,
      contractAddress: process.env.NFT_CONTRACT_ADDRESS,
      fromAddress: "",         // minted from zero address
      toAddress: auction.winner.walletAddress,
      fromUserId: null,
      toUserId: auction.winner._id,
      salePrice: 0,
      txHash,
      platform: "knq",
      transferType: "mint"
    });

    res.status(200).json({
      success: true,
      message: `NFT #${tokenId} minted successfully to ${auction.winner.walletAddress}`,
      tokenId,
      txHash,
      explorerUrl: getTxExplorerUrl(txHash),
      openSeaUrl: getOpenSeaUrl(tokenId)
    });
  } catch (err) {
    console.error("[NFT] mintAuctionNFT error:", err);
    await Auction.findByIdAndUpdate(auctionId, { nftStatus: "failed" });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Alchemy Webhook: Sync On-Chain Transfers ─────────────────────────────────

/**
 * POST /api/nft/webhook/transfer
 * Called by Alchemy Activity Webhook when any transfer event fires
 * on the KnQNFT contract (secondary sales on OpenSea, etc.).
 */
const syncOwnershipWebhook = async (req, res) => {
  // Acknowledge immediately — process async
  res.status(200).json({ received: true });

  try {
    const { event } = req.body;
    if (!event || !event.activity) return;

    for (const activity of event.activity) {
      if (activity.category !== "token") continue;
      const { fromAddress, toAddress, erc721TokenId, log } = activity;
      if (!erc721TokenId) continue;

      const tokenId = parseInt(erc721TokenId, 16);
      const txHash = log?.transactionHash;
      if (!txHash) continue;

      // Avoid duplicates
      const exists = await NFTOwnership.findOne({ txHash });
      if (exists) continue;

      // Look up users by wallet
      const [fromUser, toUser] = await Promise.all([
        User.findOne({ walletAddress: fromAddress?.toLowerCase() }).select("_id"),
        User.findOne({ walletAddress: toAddress?.toLowerCase() }).select("_id")
      ]);

      await NFTOwnership.create({
        tokenId,
        contractAddress: process.env.NFT_CONTRACT_ADDRESS,
        fromAddress: fromAddress?.toLowerCase() || "",
        toAddress: toAddress?.toLowerCase(),
        fromUserId: fromUser?._id || null,
        toUserId: toUser?._id || null,
        txHash,
        platform: "other",
        transferType: "sale"
      });

      console.log(`[NFT Webhook] Synced transfer: token #${tokenId} → ${toAddress}`);
    }
  } catch (err) {
    console.error("[NFT Webhook] Error:", err.message);
  }
};

/**
 * POST /api/nft/deposit/record/:auctionId
 * Authenticated winner records their on-chain vault deposit transaction hash.
 */
const recordDeposit = async (req, res) => {
  const { auctionId } = req.params;
  const { txHash } = req.body;

  try {
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found" });
    }

    // Security: Only the winner can record their deposit
    if (auction.winner?.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Only the auction winner can perform this action" });
    }

    auction.vaultDepositTxHash = txHash;
    auction.nftStatus = "deposit_received";
    await auction.save();

    res.json({ success: true, message: "Deposit recorded", nftStatus: auction.nftStatus });
  } catch (err) {
    console.error("recordDeposit error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/nft/admin/settle/:auctionId
 * Admin triggers on-chain vault settlement (atomic NFT + MATIC swap).
 */
const settleAuction = async (req, res) => {
  const { auctionId } = req.params;

  try {
    const auction = await Auction.findById(auctionId).populate("winner creator");
    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found" });
    }

    if (auction.nftStatus !== "minted" && auction.nftStatus !== "deposit_received" && auction.nftStatus !== "failed_settle") {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid NFT status for settlement: ${auction.nftStatus}. Must be minted, deposit_received, or failed_settle.` 
      });
    }

    if (!auction.tokenId) {
      return res.status(400).json({ success: false, message: "NFT has not been minted yet (no token ID found)." });
    }

    const creatorWallet = auction.creatorWalletAddress || auction.creator?.walletAddress;
    if (!creatorWallet) {
      return res.status(400).json({ success: false, message: "Creator does not have a linked wallet address." });
    }

    console.log(`[Settlement] Triggering on-chain settlement for Auction ${auctionId}...`);
    
    // Call the on-chain service
    const { txHash } = await settleAuctionOnChain(
      auction._id.toString(),
      auction.tokenId,
      creatorWallet
    );

    auction.settlementTxHash = txHash;
    auction.nftStatus = "settled";
    await auction.save();

    console.log(`[Settlement] Successfully settled Auction ${auctionId}. Tx: ${txHash}`);

    res.json({
      success: true,
      message: "Auction settled on-chain successfully.",
      txHash,
      nftStatus: auction.nftStatus
    });
  } catch (err) {
    console.error("settleAuction error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Background / Manual: Process Vault Settlements
 * Automatically triggers settleAuctionOnChain for auctions where winner has deposited MATIC.
 */
const processVaultSettlements = async () => {
  if (process.env.ENABLE_WEB3 !== "true") return;

  try {
    // Find auctions waiting for settlement
    const pendingAuctions = await Auction.find({
      nftStatus: "deposit_received"
    }).populate("creator", "walletAddress");

    if (pendingAuctions.length === 0) return;

    console.log(`[Settlement Worker] Found ${pendingAuctions.length} auctions waiting for settlement.`);

    for (const auction of pendingAuctions) {
      try {
        const creatorWallet = auction.creatorWalletAddress || auction.creator?.walletAddress;
        
        if (!creatorWallet) {
          console.error(`[Settlement Worker] Skip Auction ${auction._id}: Creator has no linked wallet.`);
          continue;
        }

        // Lock the auction to prevent concurrent settlement attempts
        auction.nftStatus = "settling";
        await auction.save();

        console.log(`[Settlement Worker] Auto-settling Auction ${auction._id} (Token #${auction.tokenId})...`);

        const { txHash } = await settleAuctionOnChain(
          auction._id.toString(),
          auction.tokenId,
          creatorWallet
        );

        auction.settlementTxHash = txHash;
        auction.nftStatus = "settled";
        await auction.save();

        console.log(`[Settlement Worker] Success: Auction ${auction._id} settled. Tx: ${txHash}`);
      } catch (err) {
        console.error(`[Settlement Worker] Failed to settle Auction ${auction._id}:`, err.message);
        // Revert status to allow retry or manual intervention
        await Auction.findByIdAndUpdate(auction._id, { nftStatus: "failed_settle" });
      }
    }
  } catch (error) {
    console.error("[Settlement Worker] Global Error:", error.message);
  }
};

const claimNFTBySponsor = async (req, res) => {
  const { auctionId } = req.params;
  const userId = req.user.userId;

  try {
    const auction = await Auction.findById(auctionId).populate("winner");
    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found." });
    }

    if (auction.winner?._id.toString() !== userId && auction.winner?.id !== userId) {
      return res.status(403).json({ success: false, message: "Only the auction winner can claim the NFT." });
    }

    if (auction.nftStatus === "deposit_received" || auction.nftStatus === "settled") {
      return res.status(400).json({ success: false, message: "NFT is already claimed or settled." });
    }

    // Default matic price (₹7) or read from environment / config
    let maticPrice = 7;
    try {
      // Try to import or fetch the configured MATIC price if endpoint is available
      const priceRes = await axios.get(`${req.protocol}://${req.get('host')}/api/config/matic-price`);
      if (priceRes?.data?.success) {
        maticPrice = priceRes.data.price;
      }
    } catch (_) {}

    const maticAmount = (auction.highestBid / maticPrice).toFixed(6);

    console.log(`[Claim] Sponsoring NFT claim for Auction ${auctionId}. MATIC to transfer: ${maticAmount}`);

    // Call the sponsored web3 transaction
    const { txHash } = await sponsorDepositBid(auctionId, maticAmount);

    auction.vaultDepositTxHash = txHash;
    auction.nftStatus = "deposit_received";
    await auction.save();

    return res.status(200).json({
      success: true,
      message: "NFT deposit transaction successfully sponsored.",
      txHash,
      nftStatus: auction.nftStatus
    });

  } catch (err) {
    console.error("[Claim] claimNFTBySponsor error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  linkWallet,
  getMyCollection,
  getNFTDetail,
  getMarketplace,
  prepareIPFS,
  mintAuctionNFT,
  recordDeposit,
  settleAuction,
  syncOwnershipWebhook,
  processVaultSettlements,
  claimNFTBySponsor
};


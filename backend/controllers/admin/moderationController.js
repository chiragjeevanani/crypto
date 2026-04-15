const Post = require("../../models/Post");
const Report = require("../../models/Report");
const Withdrawal = require("../../models/Withdrawal");
const { getBaseUrl, mediaUrlFromPost, populateCreator } = require("../../utils/postHelpers");

/**
 * Admin module: list posts for moderation. Requires token + admin role.
 * Separate from user module; used only by admin panel.
 */
exports.getPosts = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const statusFilter = req.query.status;
    const creatorId = req.query.creator;
    const isNFT = req.query.isNFT;
    const isBusiness = req.query.isBusiness;
    let query = Post.find();
    if (statusFilter) query = query.where("status").equals(statusFilter);
    if (creatorId) query = query.where("creator").equals(creatorId);
    if (isNFT === "true" || isNFT === "1") query = query.where("isNFT").equals(true);
    if (isBusiness === "true" || isBusiness === "1") query = query.where("isBusiness").equals(true);
    const posts = await populateCreator(query).sort({ createdAt: -1 }).limit(500).exec();
    const adminList = posts.map((p) => {
      const url = mediaUrlFromPost(p, baseUrl);
      const type = p.media?.type === "video" ? "Video" : p.media?.type === "audio" ? "Audio" : "Image";
      return {
        id: p._id.toString(),
        author: p.creator?.handle || p.creator?.name || "unknown",
        type,
        content: (p.caption || "").slice(0, 80),
        caption: p.caption || "",
        flagReason: p.status === "flagged" ? "Flagged" : "Pending review",
        status: p.status === "approved" ? "Approved" : p.status === "rejected" ? "Rejected" : "Pending",
        thumbnail: url,
        mediaUrl: url,
        mediaType: p.media?.type || "image",
        isBusiness: Boolean(p.isBusiness),
        paymentStatus: p.paymentStatus || "pending",
        promotion: p.promotion || null,
        isNFT: Boolean(p.isNFT),
        history: p.history || [],
        createdAt: p.createdAt
      };
    });
    return res.status(200).json({ success: true, posts: adminList });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin module: get single post detail for moderation view.
 */
exports.getPostById = async (req, res) => {
  try {
    const post = await populateCreator(Post.findById(req.params.id));
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    const baseUrl = getBaseUrl(req);
    return res.status(200).json({
      success: true,
      post: {
        id: post._id.toString(),
        author: post.creator?.handle || post.creator?.name,
        type: post.media?.type === "video" ? "Video" : post.media?.type === "audio" ? "Audio" : "Image",
        content: post.caption,
        thumbnail: mediaUrlFromPost(post, baseUrl),
        mediaUrl: mediaUrlFromPost(post, baseUrl),
        mediaType: post.media?.type || "image",
        isBusiness: Boolean(post.isBusiness),
        paymentStatus: post.paymentStatus || "pending",
        promotion: post.promotion || null,
        createdAt: post.createdAt,
        status: post.status,
        flagReason: "Pending review",
        reportCount: 0,
        aiRiskScore: "—",
        moderationNotes: post.isBusiness ? `Business Promotion: [Payment: ${post.paymentStatus?.toUpperCase()}] Review ad budget and content.` : "Review and approve or reject.",
        authorStats: { followers: 0, posts: 0, previousFlags: 0 },
        reports: []
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin module: approve or reject post. Requires token + admin role.
 */
exports.updatePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, reason } = req.body;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    // Enforce payment check for business posts
    if (approved && post.isBusiness && post.paymentStatus !== "paid") {
      return res.status(400).json({ success: false, message: "Cannot approve an ad post with unpaid or failed status." });
    }

    post.status = approved ? "approved" : "rejected";
    if (approved) {
      post.isPublished = true;
      if (post.isBusiness && post.promotion) {
        post.promotion.status = "active";
        post.promotion.startDate = new Date();
        const duration = post.promotion.duration || 30; // default 30 if 0? No, 0 means live.
        if (duration > 0) {
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + duration);
          post.promotion.endDate = endDate;
        }
      }
    }
    if (reason) post.rejectReason = reason;

    // Log in history
    post.history.push({
      action: approved ? (post.isBusiness ? "Promotion Approved & Published" : "Approved by Admin") : `Rejected by Admin. Reason: ${reason || "No reason specified."}`,
      admin: "SuperAdmin"
    });

    await post.save();
    const baseUrl = getBaseUrl(req);
    return res.status(200).json({
      success: true,
      post: {
        id: post._id.toString(),
        author: post.creator?.toString(),
        type: post.media?.type || "Image",
        content: (post.caption || "").slice(0, 80),
        status: post.status === "approved" ? "Approved" : "Rejected",
        thumbnail: mediaUrlFromPost(post, baseUrl)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin module: acknowledge business ads as viewed.
 */
exports.acknowledgeBusinessAds = async (req, res) => {
  try {
    await Post.updateMany({ isBusiness: true, status: "pending", isAdminViewed: false }, { isAdminViewed: true });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin module: get counts for sidebar badges.
 */
exports.getModerationStats = async (req, res) => {
  try {
    const unviewedAds = await Post.countDocuments({ isBusiness: true, status: "pending", isAdminViewed: false });
    const pendingNFTs = await Post.countDocuments({ isNFT: true, status: "pending" });
    const pendingReports = await Report.countDocuments({ status: "pending" });
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: "pending" });

    res.status(200).json({
      success: true,
      stats: {
        ads: unviewedAds,
        nfts: pendingNFTs,
        reports: pendingReports,
        withdrawals: pendingWithdrawals
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

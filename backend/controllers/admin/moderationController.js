const Post = require("../../models/Post");
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
    let query = Post.find();
    if (statusFilter) query = query.where("status").equals(statusFilter);
    if (creatorId) query = query.where("creator").equals(creatorId);
    if (isNFT === "true" || isNFT === "1") query = query.where("isNFT").equals(true);
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
        isNFT: Boolean(p.isNFT)
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
        createdAt: post.createdAt,
        status: post.status,
        flagReason: "Pending review",
        reportCount: 0,
        aiRiskScore: "—",
        moderationNotes: "Review and approve or reject.",
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
    post.status = approved ? "approved" : "rejected";
    if (reason) post.rejectReason = reason;
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

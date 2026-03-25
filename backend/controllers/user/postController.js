const Post = require("../../models/Post");
const User = require("../../models/User");
const Comment = require("../../models/Comment");
const Campaign = require("../../models/Campaign");
const { computeStatus, formatCampaignForUser } = require("../../utils/campaignHelpers");
const fs = require("fs");
const path = require("path");
const { getBaseUrl, formatPostForUserFeed, populateCreator, resolveUrl } = require("../../utils/postHelpers");
const { UPLOAD_DIR } = require("../../utils/upload");
const { cloudinary } = require("../../utils/cloudinary");

/**
 * User module: create post. Requires token (protect) and role User (authorize).
 * Does not mix with admin; only users with role "User" can create via this API.
 */
exports.createPost = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const baseUrl = getBaseUrl(req);
    const file = req.file;
    let mediaUrl = "";
    let mediaType = "image";

    if (file) {
      const localPath = path.join(UPLOAD_DIR, file.filename);
      const useCloudinary = Boolean(
        cloudinary &&
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
      );

      if (useCloudinary) {
        const resourceType = file.mimetype.startsWith("video/")
          ? "video"
          : file.mimetype.startsWith("audio/")
          ? "video" // Cloudinary treats long audio via video resource_type
          : "image";
        const uploadResult = await cloudinary.uploader.upload(localPath, {
          resource_type: "auto",
          folder: "crypto-app/posts"
        });
        mediaUrl = uploadResult.secure_url;
        if (file.mimetype.startsWith("video/")) mediaType = "video";
        else if (file.mimetype.startsWith("audio/")) mediaType = "audio";

        // best-effort cleanup
        fs.unlink(localPath, () => {});
      } else {
        mediaUrl = `/uploads/${file.filename}`;
        if (file.mimetype.startsWith("video/")) mediaType = "video";
        else if (file.mimetype.startsWith("audio/")) mediaType = "audio";
      }
    }

    const body = req.body || {};
    const caption = typeof body.caption === "string" ? body.caption.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "General";
    const filter = typeof body.filter === "string" ? body.filter : "none";
    const musicTrackId = typeof body.musicTrackId === "string" ? body.musicTrackId : "none";
    const isNFT = body.isNFT === true || body.isNFT === "true";
    const nftPriceINR = Math.max(0, Number(body.nftPriceINR) || 0);

    if (!mediaUrl) {
      return res.status(400).json({ success: false, message: "Media file is required" });
    }

    const user = await User.findById(userId).select("name handle avatar role").lean();
    
    // Business fields
    const isBusiness = body.isBusiness === true || body.isBusiness === "true";
    const ctaType = body.ctaType || "none";
    const redirectType = body.redirectType || "none";
    const whatsappNumber = body.whatsappNumber || "";
    const externalLink = body.externalLink || "";

    const post = await Post.create({
      creator: userId,
      media: { type: mediaType, url: mediaUrl, aspectRatio: body.aspectRatio || "4/3" },
      caption,
      category,
      filter,
      musicTrackId,
      isNFT,
      nftPriceINR,
      status: "approved", // Temporarily auto-approve all posts
      isBusiness,
      ctaType,
      redirectType,
      whatsappNumber,
      externalLink,
      paymentStatus: "paid", // Temporarily mark all as paid
      isPublished: true, // Temporarily auto-publish all
      musicId: body.musicId || null,
      musicStartTime: Number(body.musicStartTime) || 0
    });

    const forFeed = formatPostForUserFeed(post, baseUrl, { ...user, _id: user?._id });
    return res.status(201).json({ success: true, post: forFeed });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Internal: Interleave campaigns every N posts.
 * campaigns: array of already-formatted campaign objects (via formatCampaignForUser)
 */
const injectCampaignCards = (posts, campaigns, interval) => {
  if (!campaigns.length) return posts;
  const output = [];
  let campaignIndex = 0;

  // Always show one at the very top if available
  output.push({
    id: `campaign-card-top-${campaigns[0].id}`,
    postType: "campaign_card",
    campaign: campaigns[0],
    createdAt: new Date()
  });
  campaignIndex = 1;

  for (let i = 0; i < posts.length; i += 1) {
    output.push(posts[i]);
    const isInsertPoint = (i + 1) % interval === 0;
    if (isInsertPoint && campaigns[campaignIndex % campaigns.length]) {
      const campaign = campaigns[campaignIndex % campaigns.length];
      campaignIndex += 1;
      output.push({
        id: `campaign-card-${campaign.id}-${i}`,
        postType: "campaign_card",
        campaign: campaign,
        createdAt: new Date()
      });
    }
  }
  return output;
};

/**
 * User module: get feed (approved posts only). Requires token.
 * Returns creators with display name/handle; in user module we never expose admin labels.
 */
exports.getPosts = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const currentUserId = req.user?.userId?.toString?.();
    const posts = await populateCreator(
      Post.find({ status: "approved" }).sort({ createdAt: -1 }).limit(200)
    ).exec();
    const list = posts.map((p) => formatPostForUserFeed(p, baseUrl, null, currentUserId));

    // Interleave Active Campaigns
    const campaignsRaw = await Campaign.find({ status: "Active" }).sort({ createdAt: -1 }).limit(10).lean();
    const now = new Date();
    const activeCampaigns = campaignsRaw
      .map((c) => ({ ...c, status: computeStatus(c) }))
      .filter((c) => {
        if (c.status !== "Active") return false;
        const now = new Date();
        const start = c.startDate ? new Date(c.startDate) : null;
        const end = c.endDate ? new Date(c.endDate) : null;
        
        if (start && start > now) return false;
        if (end) {
          // Set end time to 23:59:59.999 of that day to ensure it lasts the whole day
          const endOfDay = new Date(end);
          endOfDay.setHours(23, 59, 59, 999);
          if (endOfDay < now) return false;
        }
        return true;
      })
      .map((c) => formatCampaignForUser(c, req));

    const interleaved = injectCampaignCards(list, activeCampaigns, 5);

    if (!interleaved.length) {
      const demoPost = {
        id: "demo-post-1",
        creator: {
          id: "",
          username: "Welcome to Crypto App",
          handle: "@crypto_app",
          avatar: null,
          isFollowing: false
        },
        media: {
          type: "image",
          url:
            "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800&q=80",
          aspectRatio: "4/3"
        },
        caption:
          "There are no posts yet. Create your first post to start earning from tasks, campaigns, and gifts.",
        postType: "regular",
        allowGifts: false,
        likes: 0,
        comments: 0,
        shares: 0,
        earnings: 0,
        isLiked: false,
        createdAt: new Date(),
        status: "approved",
        category: "General",
        musicTrackId: "none"
      };
      return res.status(200).json({ success: true, posts: [demoPost] });
    }

    return res.status(200).json({ success: true, posts: interleaved });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * User module: get single post by id (approved only). Requires token.
 */
exports.getPostById = async (req, res) => {
  try {
    const currentUserId = req.user?.userId?.toString?.();
    const post = await populateCreator(Post.findOne({ _id: req.params.id, status: "approved" })).exec();
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    const baseUrl = getBaseUrl(req);
    const formatted = formatPostForUserFeed(post, baseUrl, null, currentUserId);
    return res.status(200).json({ success: true, post: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Toggle like on a post. Requires token.
 */
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    const likedBy = post.likedBy || [];
    const idStr = userId.toString();
    const hasLiked = likedBy.some((oid) => oid && oid.toString() === idStr);
    if (hasLiked) {
      post.likedBy = likedBy.filter((oid) => oid.toString() !== idStr);
      post.likes = Math.max(0, (post.likes || 0) - 1);
    } else {
      post.likedBy = [...likedBy, userId];
      post.likes = (post.likes || 0) + 1;
    }
    await post.save();
    return res.status(200).json({
      success: true,
      liked: !hasLiked,
      likes: post.likes
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Format comment author for user app: never expose admin identities (e.g. Super Admin).
 * Only role "User" gets real name/handle; others get "User" / "@user".
 */
function formatCommentAuthorForUser(author) {
  if (!author) return { id: "", name: "User", handle: "@user", avatar: null };
  const isUserRole = author.role === "User";
  const name = isUserRole ? (author.name || "User") : "User";
  const handle = isUserRole
    ? (author.handle || `@${(author.name || "user").replace(/\s+/g, "").toLowerCase()}`)
    : "@user";
  const h = handle.startsWith("@") ? handle : `@${handle}`;
  return {
    id: author._id?.toString?.() || "",
    name,
    handle: h,
    avatar: author.avatar || null
  };
}

/**
 * Get comments for a post. Requires token. Author display masked for user app (no admin labels).
 */
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate("author", "name handle avatar role")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const list = comments.map((c) => ({
      id: c._id.toString(),
      postId: c.post.toString(),
      author: formatCommentAuthorForUser(c.author),
      text: c.text,
      createdAt: c.createdAt
    }));
    return res.status(200).json({ success: true, comments: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add a comment to a post. Requires token.
 */
exports.createComment = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!text) return res.status(400).json({ success: false, message: "Comment text is required" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    const comment = await Comment.create({ post: post._id, author: userId, text });
    post.comments = (post.comments || 0) + 1;
    await post.save();
    const author = await User.findById(userId).select("name handle avatar role").lean();
    const commentObj = {
      id: comment._id.toString(),
      postId: post._id.toString(),
      author: formatCommentAuthorForUser(author ? { ...author, _id: author._id } : null),
      text: comment.text,
      createdAt: comment.createdAt
    };
    return res.status(201).json({ success: true, comment: commentObj, commentCount: post.comments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Record share: one count per user. If the current user already shared this post, count is unchanged.
 */
exports.sharePost = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const postId = req.params.id;
    if (!postId) return res.status(400).json({ success: false, message: "Post id is required" });
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    post.sharedBy.push(userId);
    post.shares = (post.shares || 0) + 1;
    await post.save();

    const sharesCount = Number(post.shares) || 0;
    return res.status(200).json({
      success: true,
      shares: sharesCount,
      added: !alreadyShared
    });
  } catch (error) {
    if (error.name === "CastError" && error.path === "_id") {
      return res.status(400).json({ success: false, message: "Invalid post id" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const Post = require("../../models/Post");
const User = require("../../models/User");
const mongoose = require("mongoose");
const Comment = require("../../models/Comment");
const Campaign = require("../../models/Campaign");
const Report = require("../../models/Report");
const WalletTransaction = require("../../models/WalletTransaction");
const MediaAsset = require("../../models/MediaAsset");
const CampaignSubmission = require("../../models/CampaignSubmission");
const fs = require("fs");
const path = require("path");
const { UPLOAD_DIR } = require("../../utils/upload");

/**
 * Deletes a post's rendition-ladder/HLS asset directory, but only when every
 * safety check passes: the path shape is exactly what the pipeline produces
 * and resolves inside uploads/videos (never trust a DB string blindly for
 * fs paths), the post isn't a campaign submission (those share their file
 * with CampaignSubmission.reel.url, which drives admin verification/payouts
 * independently of the Post), no other Post references the same assetDir,
 * and no CampaignSubmission references the asset. Any failed check, or any
 * filesystem error, just retains the files and logs why — this must never
 * turn a successful post deletion into a failed one. Legacy posts (no
 * assetDir at all) are untouched, exactly as before this pipeline existed.
 */
async function deletePostVideoAssetsSafely(post) {
  try {
    const assetDir = post?.media?.assetDir;
    if (!assetDir || typeof assetDir !== "string") return;

    const match = assetDir.match(/^\/uploads\/videos\/([A-Za-z0-9._-]+)$/);
    if (!match) {
      console.warn(`[deletePost] skipping asset cleanup for ${post._id} — unexpected assetDir shape: ${assetDir}`);
      return;
    }
    const assetId = match[1];
    const videosRoot = path.resolve(UPLOAD_DIR, "videos");
    const resolvedPath = path.resolve(videosRoot, assetId);
    const relative = path.relative(videosRoot, resolvedPath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      console.warn(`[deletePost] skipping asset cleanup for ${post._id} — path traversal guard tripped: ${assetDir}`);
      return;
    }

    if (post.campaignSubmission) {
      console.log(`[deletePost] retaining assets for ${post._id}: post has a campaignSubmission`);
      return;
    }

    const otherPostCount = await Post.countDocuments({ "media.assetDir": assetDir, _id: { $ne: post._id } });
    if (otherPostCount > 0) {
      console.log(`[deletePost] retaining assets for ${post._id}: referenced by ${otherPostCount} other post(s)`);
      return;
    }

    const escapedAssetId = assetId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const referencedByCampaign = await CampaignSubmission.countDocuments({
      "reel.url": { $regex: escapedAssetId },
    });
    if (referencedByCampaign > 0) {
      console.log(`[deletePost] retaining assets for ${post._id}: referenced by a CampaignSubmission`);
      return;
    }

    await fs.promises.rm(resolvedPath, { recursive: true, force: true });
    console.log(`[deletePost] removed video assets for ${post._id}: ${resolvedPath}`);
  } catch (err) {
    console.error(`[deletePost] asset cleanup failed for ${post?._id}:`, err.message);
  }
}
exports.deletePostVideoAssetsSafely = deletePostVideoAssetsSafely;
const { computeStatus, formatCampaignForUser } = require("../../utils/campaignHelpers");
const { getBaseUrl, formatPostForUserFeed, populateCreator, resolveUrl } = require("../../utils/postHelpers");
const { getAdminConfig } = require("../../utils/adminConfig");
const { notifyAdmins } = require("../../utils/adminNotifier");

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
    let mediaExtra = {};

    if (file) {
      mediaUrl = `/uploads/${file.filename}`;
      if (file.mimetype.startsWith("video/")) mediaType = "video";
      else if (file.mimetype.startsWith("audio/")) mediaType = "audio";
    }

    // Video uploaded through uploadHls (postRoutes.js) — videoAssetPipeline
    // middleware already created a MediaAsset and kicked off encoding in the
    // background. It may have already finished (fast source) or still be
    // running; either way this is the single place that decides what to
    // write, so there's no ordering assumption between the two.
    if (file?.assetId) {
      const asset = await MediaAsset.findOne({ assetId: file.assetId }).lean();
      if (asset?.status === "ready") {
        mediaUrl = asset.url || mediaUrl;
        mediaExtra = {
          processingStatus: "ready",
          hlsUrl: asset.hlsUrl || "",
          thumbnailUrl: asset.thumbnailUrl || "",
          assetDir: asset.assetDir || "",
          qualities: asset.qualities || [],
          width: asset.width || 0,
          height: asset.height || 0,
          duration: asset.duration || 0,
        };
      } else if (asset?.status === "failed") {
        mediaExtra = { processingStatus: "failed", processingError: asset.error || "" };
      } else {
        mediaExtra = { processingStatus: "processing", assetDir: `/uploads/videos/${file.assetId}` };
      }
    }

    let body = req.body || {};
    if (body.postData) {
      try {
        const parsed = typeof body.postData === "string" ? JSON.parse(body.postData) : body.postData;
        body = { ...body, ...parsed };
      } catch (err) {
        console.error("Failed to parse body.postData:", err);
      }
    }

    let customThumbnailUrl = "";
    if (body.coverImage && body.coverImage.startsWith("data:image/")) {
      try {
        const matches = body.coverImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = matches[1].split('/')[1] || 'jpg';
          const filename = `cover-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
          const filePath = path.join(__dirname, "..", "..", "uploads", filename);
          fs.writeFileSync(filePath, buffer);
          customThumbnailUrl = `/uploads/${filename}`;
        }
      } catch (err) {
        console.error("Failed to save custom cover image:", err);
      }
    }

    const caption = typeof body.caption === "string" ? body.caption.trim() : "";
    const language = typeof body.language === "string" ? body.language.trim() : (typeof req.body.language === "string" ? req.body.language.trim() : "English");
    const category = typeof body.category === "string" ? body.category.trim() : "General";
    const subcategory = typeof body.subcategory === "string" ? body.subcategory.trim() : "";
    const filter = typeof body.filter === "string" ? body.filter : "none";
    const musicTrackId = typeof body.musicTrackId === "string" ? body.musicTrackId : "none";
    const musicId = (body.musicId && body.musicId !== "undefined" && body.musicId !== "" && mongoose.Types.ObjectId.isValid(body.musicId)) ? body.musicId : null;
    const isNFT = body.isNFT === true || body.isNFT === "true";
    const nftPriceINR = Math.max(0, Number(body.nftPriceINR) || 0);
    const totalCopies = isNFT ? Math.max(1, Number(body.totalCopies) || 1) : 1;

    if (!mediaUrl) {
      return res.status(400).json({ success: false, message: "Media file is required" });
    }

    const user = await User.findById(userId).select("name handle avatar role earningCoins rechargeCoins").lean();
    if (!user) return res.status(404).json({ success: false, message: "User account not found." });
    
    // Business & Promotion fields
    const isBusiness = body.isBusiness === true || body.isBusiness === "true";
    const ctaType = body.ctaType || "none";
    const redirectType = body.redirectType || "none";
    const whatsappNumber = body.whatsappNumber || "";
    const externalLink = body.externalLink || "";

    // Promotion details
    const promoEnabled = body.promoEnabled === true || body.promoEnabled === "true";
    const promotionData = {
      isEnabled: promoEnabled,
      dailyBudget: Number(body.dailyBudget) || 0,
      duration: Number(body.duration) || 0,
      totalBudget: Number(body.totalBudget) || (Number(body.dailyBudget) * Number(body.duration)) || 0,
      estimatedImpressions: body.estimatedImpressions || "",
      status: promoEnabled ? "paused" : "none" // Wait for payment/approval to activate
    };

    let musicData = undefined;
    if (body.music) {
      try {
        const parsed = typeof body.music === "string" ? JSON.parse(body.music) : body.music;
        musicData = {
          id: parsed.id || parsed._id || "",
          title: parsed.title || "",
          artist: parsed.artist || parsed.author || "",
          image: parsed.image || parsed.thumbnail || "",
          preview: parsed.preview || parsed.audioUrl || "",
          startTime: Number(parsed.startTime) || 0
        };
      } catch (err) {
        console.error("Failed to parse music body data:", err);
      }
    }

    const postDoc = await Post.create({
      creator: userId,
      media: { 
        type: mediaType, 
        url: mediaUrl, 
        aspectRatio: body.aspectRatio || "4/3", 
        ...mediaExtra,
        thumbnailUrl: customThumbnailUrl || mediaExtra.thumbnailUrl || "" 
      },
      caption,
      category,
      subcategory,
      filter,
      musicTrackId,
      isNFT,
      nftPriceINR,
      totalCopies,
      copiesSold: 0,
      status: (isNFT || isBusiness) ? "pending" : "approved", 
      isBusiness,
      ctaType,
      redirectType,
      whatsappNumber,
      externalLink,
      paymentStatus: isBusiness ? "pending" : "paid",
      isPublished: !isBusiness && !isNFT,
      promotion: promotionData,
      musicId: musicId,
      musicStartTime: Number(body.musicStartTime) || 0,
      music: musicData,
      language: language,
      history: [{ action: isBusiness ? "Promotion Submission created" : (isNFT ? "NFT Submission created" : "Post created") }]
    });

    // Notify Admins for NFT or Business Promotion
    if (isNFT || isBusiness) {
      const typeStr = isNFT ? "NFT" : "Business Promotion";
      await notifyAdmins(`New ${typeStr} submission by ${user.name} (${user.handle || '@user'}). Please review and approve.`, {
          type: "nft_promotion",
          title: `New ${typeStr} Submission`,
          referenceId: postDoc._id
      });
    }

    // Populate musicId immediately for the response
    const post = await Post.findById(postDoc._id)
      .populate("musicId", "title artist audioUrl duration thumbnail")
      .lean();

    // Credit Earning Wallet if not a business post (business posts are promotional)
    const REEL_REWARD_COINS = 10;
    if (!isBusiness) {
      const config = await getAdminConfig();
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { $inc: { earningCoins: REEL_REWARD_COINS } },
        { new: true }
      );
      
      // Auto-upgrade to Premium if threshold met
      if (!updatedUser.isPremium && updatedUser.earningCoins >= config.premiumThreshold) {
        await User.updateOne({ _id: userId }, { isPremium: true });
      }

      // Create a transaction record
      await WalletTransaction.create({
        userId,
        type: "gift_received", 
        coins: REEL_REWARD_COINS,
        amount: null,
        beforeBalance: (user.earningCoins || 0),
        afterBalance: (user.earningCoins || 0) + REEL_REWARD_COINS,
        referenceId: postDoc._id.toString(),
        referenceType: "post",
        status: "success",
        meta: { reason: "Reel Post Reward" }
      });
    }
    const forFeed = formatPostForUserFeed(post, baseUrl, { ...user, _id: user?._id });
    return res.status(201).json({ success: true, post: forFeed });
  } catch (error) {
    console.error("Create Post Error:", error);
    const errorMessage = error?.message || error?.error?.message || error?.toString() || "An internal error occurred during post creation.";
    return res.status(500).json({ success: false, message: errorMessage, stack: error?.stack });
  }
};

/**
 * User module: get own NFT listings (all statuses - pending, approved, rejected).
 * Requires token.
 */
exports.getMyNFTs = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const baseUrl = getBaseUrl(req);
    const posts = await populateCreator(
      Post.find({ creator: userId, isNFT: true }).sort({ createdAt: -1 }).limit(100)
    ).exec();

    const config = await getAdminConfig();
    const list = posts.map((p) => formatPostForUserFeed(p, baseUrl, null, userId, null, config.premiumThreshold));
    return res.status(200).json({ success: true, posts: list });
  } catch (error) {
    console.error("Get My NFTs Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * User module: get NFT collection (NFTs the user currently owns).
 * Requires token.
 */
exports.getMyCollection = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const baseUrl = getBaseUrl(req);
    const posts = await populateCreator(
      Post.find({ owner: userId, isNFT: true }).sort({ createdAt: -1 }).limit(100)
    ).exec();

    const config = await getAdminConfig();
    const list = posts.map((p) => formatPostForUserFeed(p, baseUrl, null, userId, null, config.premiumThreshold));
    return res.status(200).json({ success: true, posts: list });
  } catch (error) {
    console.error("Get My Collection Error:", error);
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
    const currentUserId = req.user?.userId;
    const currentUser = currentUserId ? await User.findById(currentUserId).select("following languages").lean() : null;
    const followingIds = new Set((currentUser?.following || []).map(id => id.toString()));

    const query = { status: "approved", isPublished: true };
    if (req.query.isNFT === "true") {
      // For NFT discovery: show approved published NFTs
      query.isNFT = true;
    }
    if (req.query.creator) query.creator = req.query.creator;

    // Soft language preference: we don't query filter by language, but sort the results in memory.
    const config = await getAdminConfig();
    const posts = await populateCreator(
      Post.find(query).sort({ createdAt: -1 }).limit(200)
    ).exec();
    const list = posts.map((p) => formatPostForUserFeed(p, baseUrl, null, currentUserId, followingIds, config.premiumThreshold));

    let sortedList = list;
    if (!req.query.creator && currentUser && currentUser.languages && currentUser.languages.length > 0) {
      const preferredLangs = currentUser.languages.map(l => l.toLowerCase());
      const preferred = [];
      const others = [];

      list.forEach((post) => {
        const isOwnPost = post.creator?._id?.toString() === currentUserId?.toString() || post.creator?.id === currentUserId;
        const postLang = (post.language || "").toLowerCase();
        const matchesPref = 
          isOwnPost ||
          preferredLangs.includes(postLang) ||
          postLang === "" ||
          postLang === "english";

        if (matchesPref) {
          preferred.push(post);
        } else {
          others.push(post);
        }
      });
      sortedList = [...preferred, ...others];
    }

    // Interleave Active Campaigns only if not NFT feed
    let interleaved = sortedList;
    if (req.query.isNFT !== "true") {
      const campaignsRaw = await Campaign.find({ status: "Active" }).sort({ createdAt: -1 }).limit(10).lean();
      const now = new Date();
      const activeCampaigns = campaignsRaw
        .map((c) => ({ ...c, status: computeStatus(c) }))
        .filter((c) => {
          if (c.status !== "Active") return false;
          const start = c.startDate ? new Date(c.startDate) : null;
          const end = c.endDate ? new Date(c.endDate) : null;
          
          if (start && start > now) return false;
          if (end) {
            const endOfDay = new Date(end);
            endOfDay.setHours(23, 59, 59, 999);
            if (endOfDay < now) return false;
          }
          return true;
        })
        .map((c) => formatCampaignForUser(c, req));

      interleaved = injectCampaignCards(sortedList, activeCampaigns, 5);

      // Pagination is strictly opt-in: no `page` param means the exact
      // full-list response this endpoint has always returned (SearchPage.jsx
      // and TasksPage.jsx call this with no params and expect that today).
      const pageParam = Number.parseInt(req.query.page, 10);
      if (Number.isInteger(pageParam) && pageParam >= 1) {
        const pageSize = Math.max(1, Math.min(50, Number.parseInt(req.query.limit, 10) || 20));
        const start = (pageParam - 1) * pageSize;
        const pageItems = interleaved.slice(start, start + pageSize);
        const hasMore = start + pageSize < interleaved.length;

        if (!pageItems.length && pageParam === 1 && !req.query.creator) {
          // Keep today's "no posts yet" welcome card on a genuinely empty feed.
        } else {
          return res.status(200).json({ success: true, posts: pageItems, page: pageParam, hasMore });
        }
      }

      if (!interleaved.length && !req.query.creator) {
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
            url: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800&q=80",
            aspectRatio: "4/3"
          },
          caption: "There are no posts yet. Create your first post to start earning from tasks, campaigns, and gifts.",
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
    } else {
      // If it's the NFT feed and there are no NFTs, provide a demo NFT
      if (!list.length && !req.query.creator) {
        const demoNFT = {
          id: "demo-nft-1",
          creator: {
            id: "system",
            username: "Crypto App Official",
            handle: "@crypto_app",
            avatar: null,
            isFollowing: false
          },
          media: {
            type: "image",
            url: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?auto=format&fit=crop&w=800&q=80",
            aspectRatio: "1/1"
          },
          caption: "Demo Exclusive NFT",
          postType: "nft",
          isNFT: true,
          nftPriceINR: 500,
          allowGifts: false,
          likes: 120,
          comments: 0,
          shares: 10,
          earnings: 0,
          isLiked: false,
          createdAt: new Date(),
          status: "approved",
          category: "Digital Art",
          musicTrackId: "none"
        };
        return res.status(200).json({ success: true, posts: [demoNFT] });
      }
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
    const currentUserId = req.user?.userId;
    const currentUser = currentUserId ? await User.findById(currentUserId).select("following").lean() : null;
    const followingIds = new Set((currentUser?.following || []).map(id => id.toString()));

    const post = await populateCreator(Post.findOne({ _id: req.params.id, status: "approved" })).exec();
    if (!post) return res.status(200).json({ success: false, message: "Post not found" });
    const baseUrl = getBaseUrl(req);
    const formatted = formatPostForUserFeed(post, baseUrl, null, currentUserId, followingIds);
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
    
    const postId = req.params.id;
    // 1. Fetch current like status once
    const post = await Post.findById(postId).select("likedBy");
    if (!post) return res.status(200).json({ success: false, message: "Post not found" });

    const idStr = userId.toString();
    const hasLiked = (post.likedBy || []).some((oid) => oid && oid.toString() === idStr);

    // 2. Perform atomic update
    const update = hasLiked 
      ? { $pull: { likedBy: userId }, $inc: { likes: -1 } }
      : { $addToSet: { likedBy: userId }, $inc: { likes: 1 } };

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      update,
      { new: true, runValidators: true }
    );

    // Ensure likes never goes negative (sanity check)
    if (updatedPost.likes < 0) {
      updatedPost.likes = 0;
      await updatedPost.save();
    }

    return res.status(200).json({
      success: true,
      liked: !hasLiked,
      likes: updatedPost.likes
    });
  } catch (error) {
    console.error("Toggle Like Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Error toggling like" });
  }
};

/**
 * Format comment author for user app: never expose admin identities (e.g. Super Admin).
 * Only role "User" gets real name/handle; others get "User" / "@user".
 */
function formatCommentAuthorForUser(author) {
  if (!author) return { id: "", name: "User", handle: "@user", avatar: null, isPremium: false };
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
    avatar: author.avatar || null,
    isPremium: !!author.isPremium
  };
}

/**
 * Get comments for a post. Requires token. Author display masked for user app (no admin labels).
 */
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate("author", "name handle avatar role isPremium")
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
    if (!post) return res.status(200).json({ success: false, message: "Post not found" });
    const comment = await Comment.create({ post: post._id, author: userId, text });
    post.comments = (post.comments || 0) + 1;
    await post.save();
    const author = await User.findById(userId).select("name handle avatar role isPremium").lean();
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
    const post = await Post.findById(postId).select("sharedBy shares");
    if (!post) return res.status(200).json({ success: false, message: "Post not found" });

    const alreadyShared = (post.sharedBy || []).some(id => id && id.toString() === userId.toString());
    
    let updatedPost = post;
    if (!alreadyShared) {
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $addToSet: { sharedBy: userId }, $inc: { shares: 1 } },
        { new: true }
      );
    }

    return res.status(200).json({
      success: true,
      shares: updatedPost.shares,
      added: !alreadyShared
    });
  } catch (error) {
    if (error.name === "CastError" && error.path === "_id") {
      return res.status(400).json({ success: false, message: "Invalid post id" });
    }
    console.error("Share Post Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Record view for a post. One count per user.
 */
exports.recordView = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    
    let postId = req.params.id;
    const mongoose = require('mongoose');
    
    // Check if the id is a collectible ID (starts with KNQ-)
    if (!mongoose.Types.ObjectId.isValid(postId)) {
        const CollectibleOwnership = require("../../../models/CollectibleOwnership");
        const ownership = await CollectibleOwnership.findOne({ collectibleId: postId });
        if (ownership && ownership.postId) {
            postId = ownership.postId.toString();
        } else {
            return res.status(200).json({ success: false, message: "Post or Collectible not found" });
        }
    }

    const post = await Post.findById(postId).select("viewedBy views");
    if (!post) return res.status(200).json({ success: false, message: "Post not found" });

    const hasViewed = (post.viewedBy || []).some(v => v && v.toString() === userId.toString());

    let updatedPost = post;
    if (!hasViewed) {
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $addToSet: { viewedBy: userId }, $inc: { views: 1 } },
        { new: true }
      );
    }

    return res.status(200).json({
      success: true,
      views: updatedPost.views,
      alreadyViewed: hasViewed
    });
  } catch (error) {
    if (error.name === "CastError" && error.path === "_id") {
      return res.status(200).json({ success: false, message: "Invalid post id" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Report a post.
 */
exports.reportPost = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const postId = req.params.id;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: "Reason is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(200).json({ success: false, message: "Post not found" });
    }

    const report = await Report.create({
      reporter: userId,
      targetId: postId,
      targetModel: "Post",
      reason,
      description: description || ""
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      report
    });
  } catch (error) {
    console.error("Report Post Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * User module: Delete post.
 * Owner only.
 */
exports.deletePost = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const postId = req.params.id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const post = await Post.findById(postId);
    if (!post) return res.status(200).json({ success: false, message: "Post not found" });

    // Verify ownership
    if (post.creator.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "You are not authorized to delete this post" });
    }

    await deletePostVideoAssetsSafely(post);

    await Post.deleteOne({ _id: postId });
    // Cleanup comments
    await Comment.deleteMany({ post: postId });

    return res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete Post Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Background worker task to process expired promotions.
 */
exports.processExpiredPromotions = async () => {
  try {
    const now = new Date();
    // Find all business posts where the promotion is active and endDate has passed
    const expiredPosts = await Post.find({
      isBusiness: true,
      "promotion.status": "active",
      "promotion.endDate": { $lte: now }
    });

    if (expiredPosts.length > 0) {
      console.log(`[Jobs] Found ${expiredPosts.length} expired promotions. Processing completion...`);
      for (const post of expiredPosts) {
        post.promotion.status = "completed";
        post.isPublished = false; // Unpublish the post so it is removed from the feed/home page
        post.history.push({
          action: "Promotion duration completed. Post automatically unpublished.",
          admin: "System"
        });
        await post.save();
        console.log(`[Jobs] Promotion completed and post unpublished: ${post._id}`);
      }
    }
  } catch (err) {
    console.error("[Jobs] Error processing expired promotions:", err.message);
  }
};

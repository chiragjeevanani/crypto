const getBaseUrl = (req) => {
  const protocol = req.get("x-forwarded-proto") || req.protocol || "http";
  const host = req.get("host") || "localhost:5000";
  return `${protocol}://${host}`;
};

const resolveUrl = (url, baseUrl) => {
  if (!url) return null;
  if (typeof url !== "string") return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  
  let path = url;
  if (path.startsWith("/uploads")) {
    path = `/api${path}`;
  } else if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  
  return `${baseUrl}${path}`;
};

const mediaUrlFromPost = (post, baseUrl) => resolveUrl(post.media?.url, baseUrl);

// Resolve a real poster image for feed thumbnails instead of pointing the
// browser at the video file itself. Order: an explicitly stored thumbnail
// (new pipeline) -> the legacy mediaOptimizer-generated "<name>.thumb.jpg"
// sitting next to the video (same convention reelFeedController already
// relies on) -> the video URL itself as a last resort, matching today's
// behavior so nothing regresses if neither exists. A 404 on the guessed
// path is harmless: the browser just shows no poster, same as an invalid
// poster URL does today.
const resolveVideoThumbnail = (post, baseUrl) => {
  const explicit = resolveUrl(post.media?.thumbnailUrl, baseUrl);
  if (explicit) return explicit;

  const videoUrl = mediaUrlFromPost(post, baseUrl);
  if (videoUrl) return videoUrl.replace(/\.[^/.]+$/, "") + ".thumb.jpg";

  return videoUrl;
};

const thumbnailUrlFromPost = (post, baseUrl) => {
  const url = mediaUrlFromPost(post, baseUrl);
  if (post.media?.type === "video") {
    // Return a video placeholder for local videos
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23f59e0b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolygon points='5 3 19 12 5 21 5 3'%3E%3C/polygon%3E%3C/svg%3E";
  }
  if (post.media?.type === "audio") {
    // Return an audio placeholder
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23f59e0b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18V5l12-2v13'%3E%3C/path%3E%3Ccircle cx='6' cy='18' r='3'%3E%3C/circle%3E%3Ccircle cx='18' cy='16' r='3'%3E%3C/circle%3E%3C/svg%3E";
  }
  return url;
};

const avatarUrlFromUser = (user, baseUrl) => {
  const avatar = user?.avatar || "";
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  if (avatar.startsWith("/")) return `${baseUrl}${avatar}`;
  return `${baseUrl}/${avatar}`;
};

/**
 * Format a user object for the frontend.
 * @param {Object} user Raw user document.
 * @param {String} baseUrl Base URL for resolving local paths.
 * @param {Number} premiumThreshold The threshold for white tick.
 */
function formatUser(user, baseUrl, premiumThreshold = 100) {
  if (!user) return null;
  const isUserRole = user.role === "User";
  const displayName = isUserRole ? (user.name ?? user.username ?? "User") : "User";
  let displayHandle = isUserRole ? (user.handle ?? `@${(user.name || "user").replace(/\s+/g, "").toLowerCase()}`) : "@user";
  if (!displayHandle.startsWith("@")) displayHandle = `@${displayHandle}`;

  const isPremiumByEarnings = Number(user.earningCoins || 0) >= premiumThreshold;
  const isPremium = user.isPremium || isPremiumByEarnings;

  return {
    id: user._id?.toString?.() || user.id || "",
    username: displayName,
    handle: displayHandle,
    avatar: avatarUrlFromUser(user, baseUrl),
    bio: user.bio || "",
    role: user.role,
    isPremium
  };
}

/**
 * Format post for user feed.
 */
function formatPostForUserFeed(post, baseUrl, creatorInfo, currentUserId, followingIds = null, premiumThreshold = 100) {
  const c = creatorInfo || post.creator;
  const formattedCreator = formatUser(c, baseUrl, premiumThreshold);
  
  const id = post._id?.toString?.() || post.id;
  const likedBy = post.likedBy || [];
  const isLiked = Boolean(
    currentUserId && likedBy.some((oid) => oid && oid.toString() === currentUserId.toString())
  );
  
  if (formattedCreator && followingIds) {
    formattedCreator.isFollowing = followingIds.has(formattedCreator.id);
  }

  const category = String(post.category || "").toLowerCase();
  const isBrandCategory = category.includes("brand") || category.includes("campaign") || category.includes("task");
  const postType = post.isNFT ? "nft" : (post.isBusiness ? "business" : (isBrandCategory ? "brand" : "regular"));
  
  return {
    id,
    creator: formattedCreator,
    media: {
      type: post.media?.type || "image",
      url: mediaUrlFromPost(post, baseUrl),
      thumbnail: post.media?.type === "video"
        ? resolveVideoThumbnail(post, baseUrl)
        : mediaUrlFromPost(post, baseUrl),
      aspectRatio: post.media?.aspectRatio || "4/3"
    },
    caption: post.caption || "",
    filter: post.filter || "none",
    postType,
    nftPriceINR: Number(post.nftPriceINR || 0),
    allowGifts: true,
    likes: post.likes || 0,
    comments: post.comments || 0,
    shares: (post.sharedBy && post.sharedBy.length) ? post.sharedBy.length : (post.shares || 0),
    views: post.views || 0,
    earnings: post.earnings || 0,
    isLiked,
    createdAt: post.createdAt,
    status: post.status,
    category: post.category,
    subcategory: post.subcategory || "",
    musicTrackId: post.musicTrackId,
    campaign: post.campaign || null,
    campaignSubmission: post.campaignSubmission || null,
    isBusiness: Boolean(post.isBusiness),
    ctaType: post.ctaType || "none",
    redirectType: post.redirectType || "none",
    whatsappNumber: post.whatsappNumber || "",
    externalLink: post.externalLink || "",
    paymentStatus: post.paymentStatus || "pending",
    isPublished: Boolean(post.isPublished),
    musicId: post.musicId ? post.musicId._id || post.musicId : null,
    musicData: (post.musicId && typeof post.musicId === "object") ? {
      id: post.musicId._id,
      title: post.musicId.title,
      artist: post.musicId.artist,
      audioUrl: resolveUrl(post.musicId.audioUrl, baseUrl),
      duration: post.musicId.duration,
      thumbnail: resolveUrl(post.musicId.thumbnail, baseUrl)
    } : (post.music && post.music.title ? {
      id: post.music.id || "",
      title: post.music.title,
      artist: post.music.artist,
      audioUrl: post.music.preview || "",
      duration: 30,
      thumbnail: post.music.image || ""
    } : null),
    musicStartTime: post.musicStartTime || 0,
    music: post.music || null,
    totalCopies: post.totalCopies || 1,
    copiesSold: post.copiesSold || 0,
    language: post.language || "English"
  };
}

function populateCreator(query) {
  return query
    // Exclude heavy arrays: likedBy, viewedBy, sharedBy are NOT needed for feed display.
    // Their COUNT equivalents (likes, views, shares) are still returned.
    .select("-likedBy -viewedBy -sharedBy -history -rejectReason -isAdminViewed")
    .populate("creator", "name email handle avatar role earningCoins isPremium bio")
    .populate("campaign", "title brandName bannerUrl rewardDetails status isActive")
    .populate("campaignSubmission", "votes voters")
    .populate("musicId", "title artist audioUrl duration thumbnail")
    .lean();
}

module.exports = {
  getBaseUrl,
  resolveUrl,
  mediaUrlFromPost,
  thumbnailUrlFromPost,
  avatarUrlFromUser,
  formatUser,
  formatPostForUserFeed,
  populateCreator
};

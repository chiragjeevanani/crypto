const getBaseUrl = (req) => {
  const protocol = req.get("x-forwarded-proto") || req.protocol || "http";
  const host = req.get("host") || "localhost:5000";
  return `${protocol}://${host}`;
};

const resolveUrl = (url, baseUrl) => {
  if (!url) return null;
  if (typeof url !== "string") return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${path}`;
};

const mediaUrlFromPost = (post, baseUrl) => resolveUrl(post.media?.url, baseUrl);

const avatarUrlFromUser = (user, baseUrl) => {
  const avatar = user?.avatar || "";
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  if (avatar.startsWith("/")) return `${baseUrl}${avatar}`;
  return `${baseUrl}/${avatar}`;
};

/**
 * Format post for user feed. In user module we never expose admin role labels:
 * only role "User" gets real name/handle; others get "User" / "@user".
 * currentUserId: optional; if provided, isLiked is set from post.likedBy.
 */
function formatPostForUserFeed(post, baseUrl, creatorInfo, currentUserId) {
  const c = creatorInfo || post.creator;
  const isUserRole = c?.role === "User";
  const displayName = isUserRole ? (c?.name ?? c?.username ?? "User") : "User";
  let displayHandle = isUserRole ? (c?.handle ?? `@${(c?.name || "user").replace(/\s+/g, "").toLowerCase()}`) : "@user";
  if (!displayHandle.startsWith("@")) displayHandle = `@${displayHandle}`;
  const id = post._id?.toString?.() || post.id;
  const likedBy = post.likedBy || [];
  const isLiked = Boolean(
    currentUserId && likedBy.some((oid) => oid && oid.toString() === currentUserId.toString())
  );
  const currentUserIdStr = currentUserId?.toString?.();
  const followers = Array.isArray(c?.followers) ? c.followers : [];
  const isFollowing = Boolean(
    currentUserIdStr &&
    followers.some((oid) => oid && oid.toString() === currentUserIdStr)
  );
  const category = String(post.category || "").toLowerCase();
  const isBrandCategory = category.includes("brand") || category.includes("campaign") || category.includes("task");
  const postType = post.isNFT ? "nft" : (post.isBusiness ? "business" : (isBrandCategory ? "brand" : "regular"));
  return {
    id,
    creator: {
      id: c?._id?.toString?.() || c?.id || "",
      username: displayName,
      handle: displayHandle,
      avatar: avatarUrlFromUser(c, baseUrl),
      isFollowing
    },
    media: {
      type: post.media?.type || "image",
      url: mediaUrlFromPost(post, baseUrl),
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
    earnings: post.earnings || 0,
    isLiked,
    createdAt: post.createdAt,
    status: post.status,
    category: post.category,
    musicTrackId: post.musicTrackId,
    campaign: post.campaign || null,
    campaignSubmission: post.campaignSubmission || null,
    // Business extensions
    isBusiness: Boolean(post.isBusiness),
    ctaType: post.ctaType || "none",
    redirectType: post.redirectType || "none",
    whatsappNumber: post.whatsappNumber || "",
    externalLink: post.externalLink || "",
    paymentStatus: post.paymentStatus || "pending",
    isPublished: Boolean(post.isPublished),
    musicId: post.musicId ? post.musicId._id || post.musicId : null,
    musicData: post.musicId && typeof post.musicId === "object" ? {
      id: post.musicId._id,
      title: post.musicId.title,
      artist: post.musicId.artist,
      audioUrl: post.musicId.audioUrl,
      duration: post.musicId.duration,
      thumbnail: post.musicId.thumbnail
    } : null,
    musicStartTime: post.musicStartTime || 0
  };
}

function populateCreator(query) {
  // Include followers so we can compute "isFollowing" in user feed
  // Also include campaign metadata
  return query
    .populate("creator", "name email handle avatar role followers")
    .populate("campaign", "title brandName bannerUrl rewardDetails status isActive")
    .populate("campaignSubmission", "votes voters")
    .populate("musicId", "title artist audioUrl duration thumbnail")
    .lean();
}

module.exports = {
  getBaseUrl,
  resolveUrl,
  mediaUrlFromPost,
  avatarUrlFromUser,
  formatPostForUserFeed,
  populateCreator
};

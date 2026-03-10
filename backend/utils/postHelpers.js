const getBaseUrl = (req) => {
  const protocol = req.get("x-forwarded-proto") || req.protocol || "http";
  const host = req.get("host") || "localhost:5000";
  return `${protocol}://${host}`;
};

const mediaUrlFromPost = (post, baseUrl) =>
  post.media?.url?.startsWith("http")
    ? post.media.url
    : `${baseUrl}${post.media?.url?.startsWith("/") ? "" : "/"}${post.media?.url || ""}`;

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
  return {
    id,
    creator: {
      id: c?._id?.toString?.() || c?.id || "",
      username: displayName,
      handle: displayHandle,
      avatar: c?.avatar || null,
      isFollowing
    },
    media: {
      type: post.media?.type || "image",
      url: mediaUrlFromPost(post, baseUrl),
      aspectRatio: post.media?.aspectRatio || "4/3"
    },
    caption: post.caption || "",
    postType: post.isNFT ? "nft" : "regular",
    allowGifts: true,
    likes: post.likes || 0,
    comments: post.comments || 0,
    shares: (post.sharedBy && post.sharedBy.length) ? post.sharedBy.length : (post.shares || 0),
    earnings: post.earnings || 0,
    isLiked,
    createdAt: post.createdAt,
    status: post.status,
    category: post.category,
    musicTrackId: post.musicTrackId
  };
}

function populateCreator(query) {
  // Include followers so we can compute "isFollowing" in user feed
  return query.populate("creator", "name email handle avatar role followers").lean();
}

module.exports = {
  getBaseUrl,
  mediaUrlFromPost,
  formatPostForUserFeed,
  populateCreator
};

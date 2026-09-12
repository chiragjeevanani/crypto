const Post = require("../../models/Post");
const User = require("../../models/User");
const Campaign = require("../../models/Campaign");
const { formatPostForUserFeed, getBaseUrl } = require("../../utils/postHelpers");
const { getAdminConfig } = require("../../utils/adminConfig");
const { computeStatus } = require("../../utils/campaignHelpers");
const { getPersonalizedFeed } = require("../../services/behaviorEngine");

const injectCampaigns = (reels, campaigns, interval) => {
  if (!campaigns.length || interval <= 0) return reels.map((item) => ({ type: "reel", ...item }));
  const output = [];
  let campaignIndex = 0;
  for (let i = 0; i < reels.length; i += 1) {
    output.push({ type: "reel", ...reels[i] });
    const isInsertPoint = (i + 1) % interval === 0;
    if (isInsertPoint) {
      const campaign = campaigns[campaignIndex % campaigns.length];
      campaignIndex += 1;
      output.push({
        type: "campaign",
        id: campaign._id.toString(),
        title: campaign.title,
        description: campaign.description,
        bannerUrl: campaign.bannerUrl,
        bannerType: campaign.bannerType,
        brandName: campaign.brandName,
        endDate: campaign.endDate,
        rewardDetails: campaign.rewardDetails,
        participationType: campaign.participationType
      });
    }
  }
  return output;
};

exports.getReelsFeed = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const interval = Math.max(3, Math.min(10, Number(req.query?.interval) || 6));
    const page = Math.max(1, Number(req.query?.page) || 1);
    const limit = Math.max(1, Number(req.query?.limit) || 10);

    const currentUserId = req.user?.userId;

    // ── Personalized feed via behavior engine ──────────────────────────────
    // strategy=fresh forces cold-start (e.g. after pull-to-refresh)
    const strategy = req.query?.strategy;
    const effectiveUserId = strategy === "fresh" ? null : currentUserId;

    const reels = await getPersonalizedFeed(effectiveUserId, limit, page);

    // ── Liked-post set for isLiked flag ───────────────────────────────────
    const skip = (page - 1) * limit;
    let likedPostIds = new Set();
    if (currentUserId) {
      const likedPosts = await Post.find({
        "media.type": "video",
        status: "approved",
        isPublished: true,
        isNFT: { $ne: true },
        likedBy: currentUserId
      })
        .skip(skip)
        .limit(limit * 2)
        .select("_id")
        .lean();
      likedPostIds = new Set(likedPosts.map((p) => p._id.toString()));
    }

    // Load following list for creator badge
    const currentUser = currentUserId
      ? await User.findById(currentUserId).select("following").lean()
      : null;
    const followingIds = new Set((currentUser?.following || []).map((id) => id.toString()));

    const config = await getAdminConfig();

    // Build poster URL from thumbnail file alongside video
    const buildPosterUrl = (mediaUrl) => {
      if (!mediaUrl) return null;
      if (mediaUrl.includes("/uploads/")) {
        return mediaUrl.replace(/\.[^/.]+$/, "") + ".thumb.jpg";
      }
      return null;
    };

    const formattedReels = reels.map((p) => {
      const formatted = formatPostForUserFeed(
        p,
        baseUrl,
        null,
        currentUserId,
        followingIds,
        config.premiumThreshold
      );
      formatted.isLiked = likedPostIds.has(String(p._id));
      if (formatted.media?.type === "video") {
        formatted.media.poster = buildPosterUrl(formatted.media.url);
      }
      return formatted;
    });

    // ── Campaign injection (unchanged) ────────────────────────────────────
    const campaignsRaw = await Campaign.find({ status: "Active" })
      .sort({ createdAt: -1 })
      .lean();
    const now = new Date();
    const activeCampaigns = campaignsRaw
      .map((c) => ({ ...c, status: computeStatus(c) }))
      .filter((c) => c.status === "Active")
      .filter((c) => {
        const start = c.startDate ? new Date(c.startDate) : null;
        const end = c.endDate ? new Date(c.endDate) : null;
        if (start && start > now) return false;
        if (end && end < now) return false;
        return true;
      });

    const campaignList = activeCampaigns.map((c) => ({
      ...c,
      bannerUrl:
        c.bannerUrl?.startsWith("http") || c.bannerUrl?.startsWith("data:")
          ? c.bannerUrl
          : `${baseUrl}${c.bannerUrl}`
    }));

    const mixed = injectCampaigns(formattedReels, campaignList, interval);

    // Track campaign impressions
    if (campaignList.length) {
      const impressions = {};
      mixed.forEach((item) => {
        if (item.type === "campaign") {
          impressions[item.id] = (impressions[item.id] || 0) + 1;
        }
      });
      const bulk = Object.entries(impressions).map(([id, count]) => ({
        updateOne: {
          filter: { _id: id },
          update: { $inc: { "analytics.impressions": count } }
        }
      }));
      if (bulk.length) await Campaign.bulkWrite(bulk);
    }

    const hasMore = reels.length === limit;

    return res.status(200).json({ success: true, items: mixed, page, hasMore });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

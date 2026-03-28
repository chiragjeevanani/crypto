const Post = require("../../models/Post");
const Campaign = require("../../models/Campaign");
const { formatPostForUserFeed, populateCreator, getBaseUrl } = require("../../utils/postHelpers");
const { computeStatus } = require("../../utils/campaignHelpers");

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
        bannerType: campaign.bannerType, // Include bannerType to correctly render video vs image
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
    const currentUserId = req.user?.userId?.toString?.();
    const reels = await populateCreator(
      Post.find({ status: "approved", "media.type": "video" }).sort({ createdAt: -1 }).limit(200)
    ).exec();
    const formattedReels = reels.map((p) => formatPostForUserFeed(p, baseUrl, null, currentUserId));

    const campaignsRaw = await Campaign.find({ status: "Active" }).sort({ createdAt: -1 }).lean();
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

    // Track impressions for campaigns inserted in the feed.
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

    return res.status(200).json({ success: true, items: mixed });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const { getBaseUrl } = require("./postHelpers");

const normalizeStatus = (status) => {
  const value = String(status || "").trim();
  if (!value) return "Draft";
  const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  if (["Draft", "Active", "Completed", "Expired", "Paused"].includes(normalized)) return normalized;
  return "Draft";
};

const computeStatus = (campaign) => {
  if (!campaign) return "Draft";
  const current = normalizeStatus(campaign.status);
  if (current === "Completed" || current === "Paused" || current === "Draft") return current;
  const now = new Date();
  if (campaign.endDate && new Date(campaign.endDate) < now) return "Expired";
  return current;
};

const formatCampaignForUser = (campaign, req) => {
  if (!campaign) return null;
  const baseUrl = getBaseUrl(req);
  const bannerUrl = campaign.bannerUrl?.startsWith("http") || campaign.bannerUrl?.startsWith("data:")
    ? campaign.bannerUrl
    : `${baseUrl}${campaign.bannerUrl}`;
  return {
    id: campaign._id.toString(),
    title: campaign.title,
    description: campaign.description,
    bannerUrl,
    brandName: campaign.brandName,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    participationType: campaign.participationType,
    taskInstructions: campaign.taskInstructions,
    rewardDetails: campaign.rewardDetails,
    numberOfWinners: campaign.numberOfWinners,
    votingEnabled: campaign.votingEnabled,
    status: computeStatus(campaign),
    tasks: campaign.tasks || [],
    analytics: campaign.analytics || {},
    participants: Array.isArray(campaign.participants) ? campaign.participants.length : 0,
    winners: campaign.winners || []
  };
};

module.exports = { normalizeStatus, computeStatus, formatCampaignForUser };

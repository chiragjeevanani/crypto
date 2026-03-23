const Campaign = require("../../models/Campaign");
const CampaignSubmission = require("../../models/CampaignSubmission");
const { normalizeStatus, computeStatus } = require("../../utils/campaignHelpers");

const toDate = (value) => {
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const requireFields = (body) => {
  const missing = [];
  if (!body.title) missing.push("title");
  if (!body.description) missing.push("description");
  if (!body.bannerUrl) missing.push("bannerUrl");
  if (!body.brandName) missing.push("brandName");
  if (!body.startDate) missing.push("startDate");
  if (!body.endDate) missing.push("endDate");
  if (!body.taskInstructions) missing.push("taskInstructions");
  if (!body.rewardDetails) missing.push("rewardDetails");
  return missing;
};

exports.createCampaign = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const body = req.body || {};
    const missing = requireFields(body);
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    const startDate = toDate(body.startDate);
    const endDate = toDate(body.endDate);
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Invalid start or end date" });
    }
    if (endDate < startDate) {
      return res.status(400).json({ success: false, message: "End date must be after start date" });
    }

    const campaign = await Campaign.create({
      title: body.title,
      description: body.description,
      bannerUrl: body.bannerUrl,
      bannerType: body.bannerType || "image",
      brandName: body.brandName,
      startDate,
      endDate,
      participationType: body.participationType || "free",
      taskInstructions: body.taskInstructions,
      rewardDetails: body.rewardDetails,
      numberOfWinners: Math.max(1, Number(body.numberOfWinners) || 1),
      votingEnabled: Boolean(body.votingEnabled),
      status: normalizeStatus(body.status || "Active"),
      createdBy: userId,
      tasks: Array.isArray(body.tasks) ? body.tasks : [],
      assets: Array.isArray(body.assets) ? body.assets : []
    });

    return res.status(201).json({ success: true, campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCampaigns = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = normalizeStatus(status);
    const campaigns = await Campaign.find(query).sort({ createdAt: -1 }).lean();
    const list = campaigns.map((c) => ({ ...c, status: computeStatus(c) }));
    return res.status(200).json({ success: true, campaigns: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
    return res.status(200).json({ success: true, campaign: { ...campaign, status: computeStatus(campaign) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const body = req.body || {};
    const updates = { ...body };
    if (updates.status) updates.status = normalizeStatus(updates.status);
    if (updates.startDate) {
      const startDate = toDate(updates.startDate);
      if (!startDate) return res.status(400).json({ success: false, message: "Invalid start date" });
      updates.startDate = startDate;
    }
    if (updates.endDate) {
      const endDate = toDate(updates.endDate);
      if (!endDate) return res.status(400).json({ success: false, message: "Invalid end date" });
      updates.endDate = endDate;
    }
    if (updates.numberOfWinners != null) {
      updates.numberOfWinners = Math.max(1, Number(updates.numberOfWinners) || 1);
    }
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
    return res.status(200).json({ success: true, campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const status = normalizeStatus(req.body?.status);
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
    return res.status(200).json({ success: true, campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
    await CampaignSubmission.deleteMany({ campaign: campaign._id });
    return res.status(200).json({ success: true, message: "Campaign deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const submissions = await CampaignSubmission.find({ campaign: req.params.id })
      .populate("user", "name handle avatar role")
      .sort({ votes: -1, createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, submissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.declareWinners = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
    const winnersCount = Math.max(1, Number(campaign.numberOfWinners) || 1);
    const top = await CampaignSubmission.find({ campaign: campaign._id })
      .sort({ votes: -1, createdAt: 1 })
      .limit(winnersCount);
    if (!top.length) {
      return res.status(400).json({ success: false, message: "No submissions to rank" });
    }
    const winnerIds = top.map((s) => s._id);
    await CampaignSubmission.updateMany(
      { campaign: campaign._id },
      { $set: { isWinner: false } }
    );
    await CampaignSubmission.updateMany(
      { _id: { $in: winnerIds } },
      { $set: { isWinner: true } }
    );
    campaign.winners = winnerIds;
    campaign.status = "Completed";
    await campaign.save();
    return res.status(200).json({ success: true, winners: top });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.markRewardDistributed = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await CampaignSubmission.findByIdAndUpdate(
      submissionId,
      { rewardDistributed: true },
      { new: true }
    );
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });
    return res.status(200).json({ success: true, submission });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

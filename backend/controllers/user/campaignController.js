const Campaign = require("../../models/Campaign");
const CampaignSubmission = require("../../models/CampaignSubmission");
const Post = require("../../models/Post");
const { formatCampaignForUser, normalizeStatus, computeStatus } = require("../../utils/campaignHelpers");
const { getBaseUrl } = require("../../utils/postHelpers");
const { UPLOAD_DIR } = require("../../utils/upload");
const { cloudinary } = require("../../utils/cloudinary");
const fs = require("fs");
const path = require("path");

const toDate = (value) => {
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const isActiveCampaign = (campaign) => {
  const now = new Date();
  if (campaign.status !== "Active") return false;
  if (campaign.startDate && new Date(campaign.startDate) > now) return false;
  if (campaign.endDate && new Date(campaign.endDate) < now) return false;
  return true;
};

exports.getCampaigns = async (req, res) => {
  try {
    const status = req.query?.status ? normalizeStatus(req.query.status) : "Active";
    const campaigns = await Campaign.find(status ? { status } : {})
      .sort({ createdAt: -1 })
      .lean();
    const list = campaigns
      .map((c) => ({ ...c, status: computeStatus(c) }))
      .filter((c) => (status === "Active" ? isActiveCampaign(c) : true))
      .map((c) => formatCampaignForUser(c, req));
    return res.status(200).json({ success: true, campaigns: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
    const formatted = formatCampaignForUser({ ...campaign, status: computeStatus(campaign) }, req);
    if (req.query?.track === "1") {
      await Campaign.updateOne({ _id: campaign._id }, { $inc: { "analytics.clicks": 1 } });
    }
    return res.status(200).json({ success: true, campaign: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.joinCampaign = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
    const now = new Date();
    if (campaign.startDate && new Date(campaign.startDate) > now) {
      return res.status(400).json({ success: false, message: "Campaign has not started yet" });
    }
    if (campaign.endDate && new Date(campaign.endDate) < now) {
      return res.status(400).json({ success: false, message: "Campaign has ended" });
    }
    const exists = (campaign.participants || []).some((u) => u.toString() === userId.toString());
    if (!exists) {
      campaign.participants.push(userId);
      campaign.analytics.joins = (campaign.analytics?.joins || 0) + 1;
      await campaign.save();
    }
    return res.status(200).json({
      success: true,
      joined: true,
      participants: campaign.participants.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitEntry = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
    if (campaign.status !== "Active") {
      return res.status(400).json({ success: false, message: "Campaign is not active" });
    }
    const now = new Date();
    if (campaign.startDate && new Date(campaign.startDate) > now) {
      return res.status(400).json({ success: false, message: "Campaign has not started yet" });
    }
    if (campaign.endDate && new Date(campaign.endDate) < now) {
      return res.status(400).json({ success: false, message: "Campaign has ended" });
    }

    const caption = typeof req.body?.caption === "string" ? req.body.caption.trim() : "";
    const file = req.file;
    let mediaUrl = req.body?.mediaUrl ? String(req.body.mediaUrl) : "";
    let mediaType = req.body?.mediaType || "image";

    if (file) {
      const localPath = path.join(UPLOAD_DIR, file.filename);
      const useCloudinary = Boolean(
        cloudinary &&
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
      );
      if (useCloudinary) {
        const uploadResult = await cloudinary.uploader.upload(localPath, {
          resource_type: "auto",
          folder: "crypto-app/campaigns"
        });
        mediaUrl = uploadResult.secure_url;
        mediaType = file.mimetype.startsWith("video/") ? "video" : "image";
        fs.unlink(localPath, () => {});
      } else {
        mediaUrl = `/uploads/${file.filename}`;
        mediaType = file.mimetype.startsWith("video/") ? "video" : "image";
      }
    }

    if (!mediaUrl) {
      return res.status(400).json({ success: false, message: "Submission media is required" });
    }

    const baseUrl = getBaseUrl(req);
    const mediaUrlResolved = mediaUrl.startsWith("http") || mediaUrl.startsWith("data:")
      ? mediaUrl
      : `${baseUrl}${mediaUrl}`;

    const submission = await CampaignSubmission.create({
      campaign: campaign._id,
      user: userId,
      media: { type: mediaType, url: mediaUrlResolved },
      caption
    });

    campaign.analytics.submissions = (campaign.analytics?.submissions || 0) + 1;
    await campaign.save();

    // Best-effort: create a post so campaign entries appear in reels/profile feeds.
    try {
      const aspectRatio = mediaType === "video" ? "9/16" : "4/3";
      const postCaption = caption || `Campaign submission: ${campaign.title}`;
      const post = await Post.create({
        creator: userId,
        media: { type: mediaType, url: mediaUrlResolved, aspectRatio },
        caption: postCaption,
        category: "Campaign",
        status: "approved"
      });
      await CampaignSubmission.updateOne(
        { _id: submission._id },
        { $set: { post: post._id } }
      );
    } catch (postError) {
      // Do not fail the submission if the post creation fails.
    }

    return res.status(201).json({ success: true, submission });
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

exports.voteSubmission = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { submissionId } = req.params;
    const submission = await CampaignSubmission.findById(submissionId);
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });
    const campaign = await Campaign.findById(submission.campaign).select("votingEnabled").lean();
    if (campaign && campaign.votingEnabled === false) {
      return res.status(400).json({ success: false, message: "Voting is disabled for this campaign" });
    }
    const hasVoted = (submission.voters || []).some((id) => id.toString() === userId.toString());
    if (hasVoted) {
      return res.status(200).json({ success: true, voted: false, votes: submission.votes });
    }
    submission.voters = [...(submission.voters || []), userId];
    submission.votes = (submission.votes || 0) + 1;
    await submission.save();
    await Campaign.updateOne(
      { _id: submission.campaign },
      { $inc: { "analytics.votes": 1 } }
    );
    return res.status(200).json({ success: true, voted: true, votes: submission.votes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.trackCampaign = async (req, res) => {
  try {
    const { type } = req.body || {};
    const allowed = ["impression", "click", "join", "submission", "vote"];
    if (!allowed.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid track type" });
    }
    const fieldMap = {
      impression: "analytics.impressions",
      click: "analytics.clicks",
      join: "analytics.joins",
      submission: "analytics.submissions",
      vote: "analytics.votes"
    };
    await Campaign.updateOne({ _id: req.params.id }, { $inc: { [fieldMap[type]]: 1 } });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

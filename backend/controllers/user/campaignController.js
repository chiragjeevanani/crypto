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
    const files = req.files || {};
    const baseUrl = getBaseUrl(req);
    const useCloudinary = Boolean(
      cloudinary &&
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );

    const processFile = async (field) => {
      const file = files[field]?.[0];
      if (!file) return "";
      const localPath = path.join(UPLOAD_DIR, file.filename);
      let url = "";
      if (useCloudinary) {
        const uploadResult = await cloudinary.uploader.upload(localPath, {
          resource_type: "auto",
          folder: `crypto-app/campaigns/${field}`
        });
        url = uploadResult.secure_url;
        fs.unlink(localPath, () => {});
      } else {
        url = `${baseUrl}/uploads/${file.filename}`;
      }
      return url;
    };

    const [billUrl, productUrl, selfieUrl, reelUrl] = await Promise.all([
      processFile("bill"),
      processFile("product"),
      processFile("selfie"),
      processFile("reel")
    ]);

    if (!billUrl || !productUrl || !selfieUrl || !reelUrl) {
      return res.status(400).json({
        success: false,
        message: "Missing mandatory media. Please upload bill, product image, selfie, and reel video."
      });
    }

    const submission = await CampaignSubmission.create({
      campaign: campaign._id,
      user: userId,
      reel: { type: "video", url: reelUrl },
      billImage: billUrl,
      productImage: productUrl,
      userSelfie: selfieUrl,
      caption
    });

    campaign.analytics.submissions = (campaign.analytics?.submissions || 0) + 1;
    await campaign.save();

    // Create a public post from the reel (public part of campaign)
    try {
      const post = await Post.create({
        creator: userId,
        media: { type: "video", url: reelUrl, aspectRatio: "9/16" },
        caption: caption || `Campaign reel: ${campaign.title}`,
        category: "Campaign",
        campaign: campaign._id,
        campaignSubmission: submission._id,
        status: "approved"
      });
      await CampaignSubmission.updateOne(
        { _id: submission._id },
        { $set: { post: post._id } }
      );
    } catch (postError) {
      console.error("Post creation failed for campaign submission:", postError);
    }

    return res.status(201).json({ success: true, submission });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role || "";
    const isAdmin = ["Admin", "SuperNode", "super_admin", "Developer"].includes(currentUserRole);

    const submissions = await CampaignSubmission.find({ campaign: req.params.id })
      .populate("user", "name handle avatar role")
      .sort({ votes: -1, createdAt: -1 })
      .lean();

    // Filter sensitive fields for regular users
    const filtered = submissions.map((s) => {
      const isOwner = currentUserId && s.user?._id?.toString() === currentUserId.toString();
      if (isAdmin || isOwner) return s;

      // Hide verification media for anyone else
      return {
        ...s,
        billImage: undefined,
        productImage: undefined,
        userSelfie: undefined
      };
    });

    return res.status(200).json({ success: true, submissions: filtered });
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

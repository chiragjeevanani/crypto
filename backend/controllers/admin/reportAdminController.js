const Report = require("../../models/Report");
const Post = require("../../models/Post");
const { getBaseUrl, mediaUrlFromPost, thumbnailUrlFromPost, populateCreator } = require("../../utils/postHelpers");

/**
 * List all reports for admin review.
 */
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "name handle username avatar")
      .populate({
        path: "targetId",
        model: "Post", // Explicitly mention model for targetId since it's a dynamic ref
        populate: { path: "creator", select: "name handle username" }
      })
      .sort({ createdAt: -1 })
      .lean();

    const baseUrl = getBaseUrl(req);

    const formattedReports = reports.map(r => {
      const post = r.targetId;
      const reporter = r.reporter || {};
      const reporterHandle = reporter.handle || reporter.username || reporter.name || "user";
      
      return {
        id: r._id,
        reporter: {
          ...reporter,
          displayHandle: reporterHandle.startsWith("@") ? reporterHandle : `@${reporterHandle}`
        },
        reason: r.reason,
        description: r.description,
        status: r.status,
        actionTaken: r.actionTaken,
        createdAt: r.createdAt,
        post: post && typeof post === 'object' ? {
          id: post._id,
          thumbnail: thumbnailUrlFromPost(post, baseUrl),
          mediaUrl: mediaUrlFromPost(post, baseUrl),
          mediaType: post.media?.type,
          caption: post.caption,
          creator: post.creator ? {
            ...post.creator,
            displayHandle: (post.creator.handle || post.creator.username || post.creator.name || "user").startsWith("@") 
              ? (post.creator.handle || post.creator.username || post.creator.name || "user")
              : `@${post.creator.handle || post.creator.username || post.creator.name || "user"}`
          } : null
        } : null
      };
    });

    return res.status(200).json({ success: true, reports: formattedReports });
  } catch (error) {
    console.error("Get Reports Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Handle report action (Ignore or Delete post).
 */
exports.handleReportAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "ignore" or "delete"

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    if (action === "delete") {
      const post = await Post.findById(report.targetId);
      if (post) {
        // Option 1: Mark as rejected/deleted instead of hard delete
        post.status = "rejected";
        post.rejectReason = "Violated community guidelines (Reported)";
        post.isPublished = false;
        await post.save();
      }
      report.status = "resolved";
      report.actionTaken = "deleted";
    } else if (action === "ignore") {
      report.status = "ignored";
      report.actionTaken = "ignored";
    } else {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    report.reviewedBy = req.user?.userId;
    report.reviewedAt = new Date();
    await report.save();

    return res.status(200).json({
      success: true,
      message: `Report ${action}d successfully`
    });
  } catch (error) {
    console.error("Handle Report Action Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const Story = require("../../models/Story");
const User = require("../../models/User");
const fs = require("fs");
const path = require("path");
const { UPLOAD_DIR } = require("../../utils/upload");
const { cloudinary } = require("../../utils/cloudinary");

// Helper: 24h window
const getExpiryThreshold = () => {
  const now = new Date();
  return new Date(now.getTime() - 24 * 60 * 60 * 1000);
};

const formatStoryForClient = (story, currentUserId) => {
  const u = story.user || {};
  const isMe = currentUserId && u._id && u._id.toString() === currentUserId.toString();
  return {
    id: story._id.toString(),
    user: {
      id: u._id?.toString?.() || "",
      username: u.name || "User",
      handle: u.handle || "",
      avatar: u.avatar || ""
    },
    media: {
      type: story.media?.type || "image",
      url: story.media?.url || ""
    },
    caption: story.caption || "",
    captionStyle: story.captionStyle
      ? {
          x: Number(story.captionStyle.x) || 0.5,
          y: Number(story.captionStyle.y) || 0.8,
          textColor: story.captionStyle.textColor || "#ffffff",
          backgroundColor: story.captionStyle.backgroundColor || "#000000"
        }
      : null,
    musicTrackId: story.musicTrackId || "none",
    musicData: story.musicId && typeof story.musicId === "object" ? {
      id: story.musicId._id,
      title: story.musicId.title,
      artist: story.musicId.artist,
      audioUrl: story.musicId.audioUrl,
      duration: story.musicId.duration,
      thumbnail: story.musicId.thumbnail
    } : null,
    musicStartTime: story.musicStartTime || 0,
    createdAt: story.createdAt,
    isMe
  };
};

exports.createStory = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const file = req.file;
    const body = req.body || {};
    let mediaUrl = "";
    let mediaType = "image";

    if (!file) {
      return res.status(400).json({ success: false, message: "Story media is required" });
    }

    const localPath = path.join(UPLOAD_DIR, file.filename);
    const useCloudinary =
      cloudinary &&
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (useCloudinary) {
      try {
        const uploadResult = await cloudinary.uploader.upload(localPath, {
          resource_type: "auto",
          folder: "crypto-app/stories"
        });
        mediaUrl = uploadResult.secure_url;
        if (file.mimetype.startsWith("video/")) mediaType = "video";
        fs.unlink(localPath, () => {});
      } catch (cloudinaryErr) {
        console.error("[Story] Cloudinary upload failed, using local file:", cloudinaryErr?.message || cloudinaryErr);
        mediaUrl = `/uploads/${file.filename}`;
        if (file.mimetype.startsWith("video/")) mediaType = "video";
      }
    } else {
      mediaUrl = `/uploads/${file.filename}`;
      if (file.mimetype.startsWith("video/")) mediaType = "video";
    }

    const caption = typeof body.caption === "string" ? body.caption.trim() : "";
    const musicTrackId = typeof body.musicTrackId === "string" ? body.musicTrackId.trim() : "none";

    const captionStyle = {
      x: body.captionPosX !== undefined ? Math.min(Math.max(Number(body.captionPosX), 0), 1) : 0.5,
      y: body.captionPosY !== undefined ? Math.min(Math.max(Number(body.captionPosY), 0), 1) : 0.8,
      textColor:
        typeof body.captionTextColor === "string" && body.captionTextColor.trim()
          ? body.captionTextColor.trim()
          : "#ffffff",
      backgroundColor:
        typeof body.captionBgColor === "string" && body.captionBgColor.trim()
          ? body.captionBgColor.trim()
          : "#000000"
    };

    const story = await Story.create({
      user: userId,
      media: { type: mediaType, url: mediaUrl },
      caption,
      captionStyle,
      musicTrackId,
      musicId: body.musicId || null,
      musicStartTime: Number(body.musicStartTime) || 0
    });

    const user = await User.findById(userId).select("name handle avatar").lean();
    return res.status(201).json({
      success: true,
      story: formatStoryForClient({ ...story.toObject(), user }, userId)
    });
  } catch (error) {
    console.error("[Story] createStory error:", error?.message || error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create story" });
  }
};

exports.getFeedStories = async (req, res) => {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const me = await User.findById(currentUserId).select("following").lean();
    const followingIds = (me?.following || []).map((id) => id.toString());
    const visibleUserIds = [currentUserId.toString(), ...followingIds];

    const threshold = getExpiryThreshold();

    const stories = await Story.find({
      user: { $in: visibleUserIds },
      createdAt: { $gte: threshold },
      deletedAt: null
    })
      .populate("user", "name handle avatar")
      .populate("musicId", "title artist audioUrl duration thumbnail")
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();

    const list = stories.map((s) => formatStoryForClient(s, currentUserId));
    return res.status(200).json({ success: true, stories: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const currentUserId = req.user?.userId;
    const id = req.params.id;
    const story = await Story.findById(id).exec();
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }
    if (!currentUserId || story.user.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    story.deletedAt = new Date();
    await story.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


const mongoose = require("mongoose");
const Message = require("../../models/Message");
const User = require("../../models/User");

exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const messages = await Message.find({ roomId })
      .sort({ createdAt: 1 })
      .lean();

    // Map to client format
    const formatted = messages.map(m => ({
      id: m._id.toString(),
      sender: m.sender.toString() === currentUserId.toString() ? 'me' : 'other',
      senderId: m.sender.toString(),
      text: m.text,
      type: m.type,
      payload: m.payload,
      timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    }));

    res.json({ success: true, messages: formatted });
  } catch (error) {
    console.error("[Message] getMessages error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Find latest messages for users
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(currentUserId) },
            { receiver: new mongoose.Types.ObjectId(currentUserId) }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$$ROOT" }
        }
      }
    ]);

    const result = await Promise.all(
      messages.map(async (m) => {
        const otherUserId = m.lastMessage.sender.toString() === currentUserId.toString()
          ? m.lastMessage.receiver
          : m.lastMessage.sender;

        const otherUser = await User.findById(otherUserId).select("name handle avatar").lean();
        if (!otherUser) return null;

        // Calculate unread count for this conversation
        const unreadCount = await Message.countDocuments({
            roomId: m._id,
            receiver: currentUserId,
            status: { $ne: "seen" }
        });

        return {
          id: m._id,
          user: {
            id: otherUser._id,
            username: otherUser.name || "User",
            handle: otherUser.handle || "",
            avatar: otherUser.avatar || ""
          },
          lastMessage: {
            text: m.lastMessage.text,
            timestamp: new Date(m.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            unreadCount
          },
          isOnline: false // Frontend will update this via socket
        };
      })
    );
    res.json({ success: true, conversations: result.filter(Boolean) });
  } catch (error) {
    console.error("[Message] getConversations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const { getBaseUrl } = require("../../utils/postHelpers");
    const { cloudinary } = require("../../utils/cloudinary");
    const { UPLOAD_DIR } = require("../../utils/upload");
    const path = require("path");
    const fs = require("fs");

    const baseUrl = getBaseUrl(req);
    const localPath = path.join(UPLOAD_DIR, file.filename);
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    const isAudio = file.mimetype.startsWith("audio/");

    let resourceType = "raw";
    if (isImage) resourceType = "image";
    if (isVideo) resourceType = "video";
    if (isAudio) resourceType = "video"; // Cloudinary treats audio as video for some aspects

    const useCloudinary = Boolean(
      cloudinary &&
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );

    let url = "";
    if (useCloudinary) {
      const result = await cloudinary.uploader.upload(localPath, {
        resource_type: resourceType,
        folder: "crypto-app/messages"
      });
      url = result.secure_url;
      fs.unlink(localPath, () => {});
    } else {
      url = `${baseUrl}/uploads/${file.filename}`;
    }

    res.json({ 
        success: true, 
        url, 
        type: isImage ? "image" : (isVideo || isAudio ? "file" : "file"),
        mimeType: file.mimetype,
        name: file.originalname
    });
  } catch (error) {
    console.error("[Message] uploadMedia error:", error);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

exports.getUnreadTotal = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const total = await Message.countDocuments({
            receiver: currentUserId,
            status: { $ne: "seen" }
        });
        res.json({ success: true, total });
    } catch (error) {
        console.error("[Message] getUnreadTotal error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch unread total" });
    }
};

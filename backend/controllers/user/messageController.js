const mongoose = require("mongoose");
const Message = require("../../models/Message");
const GroupChat = require("../../models/GroupChat");
const User = require("../../models/User");
const { broadcastToRoom, emitToUser } = require("../../utils/socket");

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
      status: m.status,
      seenAt: m.seenAt,
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

    const userGroups = await GroupChat.find({ members: currentUserId }).select('_id name avatar');
    const groupIds = userGroups.map(g => g._id);

    // Find latest messages for users
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(currentUserId) },
            { receiver: new mongoose.Types.ObjectId(currentUserId) },
            { groupId: { $in: groupIds } }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      { $sort: { "lastMessage.createdAt": -1 } }
    ]);

    const result = await Promise.all(
      messages.map(async (m) => {
        if (m.lastMessage.groupId) {
          const group = userGroups.find(g => g._id.toString() === m.lastMessage.groupId.toString());
          if (!group) return null;

          const unreadCount = await Message.countDocuments({
            roomId: m._id,
            groupId: group._id,
            sender: { $ne: currentUserId },
            seenBy: { $ne: currentUserId }
          });

          return {
            id: m._id,
            isGroup: true,
            groupId: group._id,
            user: {
              id: group._id,
              username: group.name,
              handle: "Group",
              avatar: group.avatar || ""
            },
            lastMessage: {
              text: m.lastMessage.text,
              timestamp: new Date(m.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
              createdAt: m.lastMessage.createdAt,
              unreadCount
            },
            isOnline: true // Groups can always be considered active
          };
        } else {
          const otherUserId = m.lastMessage.sender.toString() === currentUserId.toString()
            ? m.lastMessage.receiver
            : m.lastMessage.sender;

          const otherUser = (await User.findById(otherUserId).select("name handle avatar").lean()) || {
            _id: otherUserId,
            name: "Deleted User",
            handle: "deleted",
            avatar: ""
          };

          // Calculate unread count for this conversation
          const unreadCount = await Message.countDocuments({
            roomId: m._id,
            receiver: currentUserId,
            status: { $ne: "seen" }
          });

          return {
            id: m._id,
            isGroup: false,
            user: {
              id: otherUser._id,
              username: otherUser.name || "User",
              handle: otherUser.handle || "",
              avatar: otherUser.avatar || ""
            },
            lastMessage: {
              text: m.lastMessage.text,
              timestamp: new Date(m.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
              createdAt: m.lastMessage.createdAt,
              unreadCount
            },
            isOnline: false // Frontend will update this via socket
          };
        }
      })
    );

    // Identify groups that have NO messages at all but the user is a member of
    const groupsWithMessages = new Set(
      result.filter(Boolean).filter(c => c.isGroup).map(c => c.groupId.toString())
    );

    const emptyGroups = userGroups
      .filter(g => !groupsWithMessages.has(g._id.toString()))
      .map(g => ({
        id: g._id.toString(), // use group id as room id
        isGroup: true,
        groupId: g._id,
        user: {
          id: g._id,
          username: g.name,
          handle: "Group",
          avatar: g.avatar || ""
        },
        lastMessage: {
          text: "Group created",
          timestamp: "",
          unreadCount: 0
        },
        isOnline: true
      }));

    const finalConversations = [...result.filter(Boolean), ...emptyGroups]
      .filter(c => c.user.id.toString() !== currentUserId.toString());

    res.json({
      success: true,
      conversations: finalConversations
    });
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

    const baseUrl = getBaseUrl(req);
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    const isAudio = file.mimetype.startsWith("audio/");

    let url = `${baseUrl}/uploads/${file.filename}`;

    res.json({
      success: true,
      url,
      type: isImage ? "image" : (isVideo ? "video" : (isAudio ? "audio" : "file")),
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

    // Unread 1v1 messages
    const unread1v1 = await Message.countDocuments({
      receiver: currentUserId,
      status: { $ne: "seen" }
    });

    // Unread group messages
    const userGroups = await GroupChat.find({ members: currentUserId }).select('_id');
    const groupIds = userGroups.map(g => g._id);

    const unreadGroups = await Message.countDocuments({
      groupId: { $in: groupIds },
      sender: { $ne: currentUserId },
      seenBy: { $ne: currentUserId }
    });

    res.json({ success: true, total: unread1v1 + unreadGroups });
  } catch (error) {
    console.error("[Message] getUnreadTotal error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch unread total" });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: "Invalid message ID" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Only sender can delete their message (or you might allow receiver to delete for themselves, but usually it's sender)
    // For now, let's allow either party to delete for themselves? No, let's do "Delete for everyone" if sender deletes.
    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this message" });
    }

    await Message.findByIdAndDelete(messageId);

    // Notify via socket
    const userIds = message.roomId.split("-");
    userIds.forEach(id => emitToUser(id, "message_deleted", { messageId, roomId: message.roomId }));

    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.error("[Message] deleteMessage error:", error);
    res.status(500).json({ success: false, message: "Failed to delete message" });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const currentUserId = req.user.userId;

    // Validate ObjectId to avoid 500 CastError
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: "Invalid message ID" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to edit this message" });
    }

    if (message.type !== "text") {
      return res.status(400).json({ success: false, message: "Only text messages can be edited" });
    }

    // New Rule: If seen, can only edit within 3 seconds
    if (message.status === "seen" && message.seenAt) {
      const seenTime = new Date(message.seenAt).getTime();
      const currentTime = Date.now();
      const diffSeconds = (currentTime - seenTime) / 1000;

      if (diffSeconds > 6) {
        return res.status(403).json({ success: false, message: "Edit window expired (6s after view)" });
      }
    }

    message.text = text;
    // Optional: mark as edited
    message.payload = { ...message.payload, isEdited: true };
    await message.save();

    // Notify via socket
    const userIds = message.roomId.split("-");
    const editData = {
      messageId,
      roomId: message.roomId,
      text,
      isEdited: true
    };
    userIds.forEach(id => emitToUser(id, "message_edited", editData));

    res.json({ success: true, message: "Message updated" });
  } catch (error) {
    console.error("[Message] editMessage error:", error);
    res.status(500).json({ success: false, message: "Failed to edit message" });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user.userId;

    // Verify user is part of this chat room
    // RoomId is usually "userId1-userId2" or similar
    if (!roomId.includes(currentUserId)) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this chat" });
    }

    // Delete all messages in the room
    await Message.deleteMany({ roomId });

    // Notify both users via socket
    const userIds = roomId.split("-");
    userIds.forEach(id => emitToUser(id, "chat_deleted", { roomId }));

    res.json({ success: true, message: "Chat history deleted" });
  } catch (error) {
    console.error("[Message] deleteChat error:", error);
    res.status(500).json({ success: false, message: "Failed to delete chat" });
  }
};

// --- Group Chat Methods ---

exports.createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const currentUserId = req.user.userId;

    if (!name) return res.status(400).json({ success: false, message: "Group name is required" });

    const user = await User.findById(currentUserId);

    // Ensure creator is in the members list
    const memberSet = new Set(members || []);
    memberSet.add(currentUserId.toString());

    const group = await GroupChat.create({
      name,
      creator: currentUserId,
      members: Array.from(memberSet),
      admins: [currentUserId]
    });

    const userName = (user.username && user.username !== 'undefined') ? user.username :
      (user.name && user.name !== 'undefined') ? user.name :
        (user.handle && user.handle !== 'undefined') ? user.handle : 'A user';

    // Create a system message
    const msg = await Message.create({
      roomId: group._id.toString(),
      groupId: group._id,
      sender: currentUserId, // Using creator as sender for system message context
      text: `${userName} created the group "${name}"`,
      type: 'system',
      status: 'sent',
      seenBy: [currentUserId]
    });

    // Broadcast to members
    broadcastToRoom(group._id.toString(), "receive_message", {
      id: msg._id.toString(),
      sender: 'other',
      senderId: currentUserId.toString(),
      text: msg.text,
      type: msg.type,
      timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });

    res.status(201).json({ success: true, group });
  } catch (error) {
    console.error("[GroupChat] createGroup error:", error);
    res.status(500).json({ success: false, message: "Failed to create group" });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const groups = await GroupChat.find({ members: currentUserId }).populate("members", "name handle avatar");
    res.json({ success: true, groups });
  } catch (error) {
    console.error("[GroupChat] getGroups error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch groups" });
  }
};

exports.addGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { members } = req.body; // array of user IDs
    const currentUserId = req.user.userId;
    const group = await GroupChat.findById(groupId);

    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    // Basic auth: Must be a member to add others (or restrict to admins)
    if (!group.members.includes(currentUserId)) {
      return res.status(403).json({ success: false, message: "Not a group member" });
    }

    const addedIds = [];
    members.forEach(m => {
      if (!group.members.includes(m)) {
        group.members.push(m);
        addedIds.push(m);
      }
    });

    await group.save();

    if (addedIds.length > 0) {
      const user = await User.findById(currentUserId);
      const addedUsers = await User.find({ _id: { $in: addedIds } });
      const addedNames = addedUsers.map(u => {
        if (u.username && u.username !== 'undefined') return u.username;
        if (u.name && u.name !== 'undefined') return u.name;
        if (u.handle && u.handle !== 'undefined') return u.handle;
        return 'someone';
      }).join(', ');

      const userName = (user.username && user.username !== 'undefined') ? user.username :
        (user.name && user.name !== 'undefined') ? user.name :
          (user.handle && user.handle !== 'undefined') ? user.handle : 'A user';

      // Create a system message
      const msg = await Message.create({
        roomId: group._id.toString(),
        groupId: group._id,
        sender: currentUserId,
        text: `${userName} added ${addedNames || 'someone'}`,
        type: 'system',
        status: 'sent',
        seenBy: [currentUserId]
      });

      // Broadcast to members
      broadcastToRoom(group._id.toString(), "receive_message", {
        id: msg._id.toString(),
        sender: 'other',
        senderId: currentUserId.toString(),
        text: msg.text,
        type: msg.type,
        timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error("[GroupChat] addGroupMembers error:", error);
    res.status(500).json({ success: false, message: "Failed to add members" });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user.userId;

    const group = await GroupChat.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    group.members = group.members.filter(m => m.toString() !== currentUserId.toString());
    group.admins = group.admins.filter(m => m.toString() !== currentUserId.toString());

    if (group.members.length === 0) {
      await GroupChat.findByIdAndDelete(groupId);
      // Optional: Delete all group messages too
      await Message.deleteMany({ groupId });
    } else {
      await group.save();
    }

    res.json({ success: true, message: "Left group successfully" });
  } catch (error) {
    console.error("[GroupChat] leaveGroup error:", error);
    res.status(500).json({ success: false, message: "Failed to leave group" });
  }
};

exports.getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await GroupChat.findById(groupId).populate("members", "name username handle avatar email");
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    // Must be a member to view details
    if (!group.members.some(m => m._id.toString() === req.user.userId)) {
      return res.status(403).json({ success: false, message: "Not a group member" });
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error("[GroupChat] getGroupDetails error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch group details" });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, avatar } = req.body;
    const group = await GroupChat.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    // Optional: Check if user is admin, for now allow any member or restrict to admins
    if (!group.admins.includes(req.user.userId)) {
      return res.status(403).json({ success: false, message: "Only admins can edit group" });
    }

    if (name) group.name = name;
    if (avatar !== undefined) group.avatar = avatar;

    await group.save();
    res.json({ success: true, group });
  } catch (error) {
    console.error("[GroupChat] updateGroup error:", error);
    res.status(500).json({ success: false, message: "Failed to update group" });
  }
};

exports.removeGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const group = await GroupChat.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    // Must be admin to remove someone
    if (!group.admins.includes(req.user.userId)) {
      return res.status(403).json({ success: false, message: "Only admins can remove members" });
    }

    // Cannot remove yourself this way (use leave group)
    if (memberId === req.user.userId) {
      return res.status(400).json({ success: false, message: "Use leave group to remove yourself" });
    }

    group.members = group.members.filter(m => m.toString() !== memberId.toString());
    group.admins = group.admins.filter(m => m.toString() !== memberId.toString());

    await group.save();
    res.json({ success: true, message: "Member removed successfully" });
  } catch (error) {
    console.error("[GroupChat] removeGroupMember error:", error);
    res.status(500).json({ success: false, message: "Failed to remove member" });
  }
};

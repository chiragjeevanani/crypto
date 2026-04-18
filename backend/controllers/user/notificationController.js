const Notification = require("../../models/Notification");
const User = require("../../models/User");

/**
 * GET /api/notifications
 * Fetch current user's notifications, newest first (paginated).
 */
exports.getNotifications = async (req, res) => {
  try {
    const recipientId = req.user.userId;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({
        $or: [{ recipientId }, { isGlobal: true }]
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("senderId", "name handle avatar")
        .lean(),
      Notification.countDocuments({
        $or: [{ recipientId }, { isGlobal: true }]
      }),
      Notification.countDocuments({ recipientId, isRead: false })
    ]);
    
    console.log(`[Notifications] Found ${notifications.length} for recipient ${recipientId}. Unread: ${unreadCount}, Total: ${total}`);

    const formatted = notifications.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      subtitle: n.subtitle,
      meta: n.meta || {},
      isRead: n.isRead,
      createdAt: n.createdAt,
      sender: n.senderId
        ? {
            id: n.senderId._id?.toString(),
            name: n.senderId.name,
            handle: n.senderId.handle,
            avatar: n.senderId.avatar
          }
        : null
    }));

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      unreadCount,
      notifications: formatted
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user.userId,
      isRead: false
    });
    return res.status(200).json({ success: true, count });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/notifications/:id/read
 * Mark a single notification as read.
 */
exports.markOneRead = async (req, res) => {
  try {
    await Notification.updateOne(
      { _id: req.params.id, recipientId: req.user.userId },
      { isRead: true }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read.
 */
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user.userId, isRead: false },
      { isRead: true }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/notifications/suggestions
 * "Who to follow" — users followed by people you follow, that you don't already follow.
 */
exports.getSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId)
      .select("following dismissedSuggestions")
      .lean();

    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const alreadyFollowing = (currentUser.following || []).map((id) => id.toString());
    const dismissed = (currentUser.dismissedSuggestions || []).map((id) => id.toString());
    const excluded = new Set([...alreadyFollowing, ...dismissed, currentUserId.toString()]);

    // Get users that your followings follow
    const followingsDetails = await User.find({ _id: { $in: currentUser.following } })
      .select("following")
      .lean();

    const candidateMap = new Map();
    for (const f of followingsDetails) {
      for (const candidate of f.following || []) {
        const cStr = candidate.toString();
        if (!excluded.has(cStr)) {
          candidateMap.set(cStr, (candidateMap.get(cStr) || 0) + 1);
        }
      }
    }

    // Sort by mutual follow count (most relevant first), pick top 5
    const sortedIds = [...candidateMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    // Also add popular users if not enough suggestions
    let suggestionUsers = await User.find({ _id: { $in: sortedIds } })
      .select("name handle avatar followers")
      .lean();

    if (suggestionUsers.length < 5) {
      const extraUsers = await User.find({
        _id: { $nin: [...excluded, ...sortedIds] }
      })
        .sort({ followers: -1 })
        .limit(5 - suggestionUsers.length)
        .select("name handle avatar followers")
        .lean();
      suggestionUsers = [...suggestionUsers, ...extraUsers];
    }

    const formatted = suggestionUsers.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      handle: u.handle || "",
      avatar: u.avatar || null,
      followerCount: Array.isArray(u.followers) ? u.followers.length : 0,
      mutualCount: candidateMap.get(u._id.toString()) || 0
    }));

    return res.status(200).json({ success: true, suggestions: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Internal helper — create a notification and optionally push via socket.
 * Used by walletController, followController, etc.
 */
exports.createNotification = async ({ 
  recipientId, 
  senderId, 
  type, 
  title, 
  subtitle, 
  meta,
  isGlobal = false
}) => {
  try {
    const notification = await Notification.create({
      recipientId: recipientId || null,
      senderId: senderId || null,
      type,
      title,
      subtitle: subtitle || "",
      meta: meta || {},
      isGlobal
    });
    return notification;
  } catch (err) {
    console.error("[Notification] Failed to create:", err.message);
    return null;
  }
};

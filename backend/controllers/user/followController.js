const User = require("../../models/User");
const { createNotification } = require("./notificationController");
const { emitToUser } = require("../../utils/socket");

/**
 * Toggle follow/unfollow another user.
 * - Stores follower + following relationships in User.followers / User.following arrays.
 * - Returns updated counts and whether the current user is now following the target.
 */
exports.toggleFollowUser = async (req, res) => {
  try {
    const currentUserId = req.user?.userId;
    const targetUserId = req.params.id;
    console.log(`[Follow] User ${currentUserId} toggling follow on ${targetUserId}`);

    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: "Target user id is required" });
    }

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot follow yourself" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Target user not found" });
    }

    if (!currentUser) {
      return res.status(404).json({ success: false, message: "Current user not found" });
    }

    const followers = Array.isArray(targetUser.followers) ? targetUser.followers : [];
    const following = Array.isArray(currentUser.following) ? currentUser.following : [];

    const curStr = currentUserId.toString();
    const tgtStr = targetUserId.toString();

    const isAlreadyFollower = followers.some((id) => id && id.toString() === curStr);

    if (isAlreadyFollower) {
      // Unfollow
      targetUser.followers = followers.filter((id) => id && id.toString() !== curStr);
      currentUser.following = following.filter((id) => id && id.toString() !== tgtStr);
    } else {
      // Follow
      targetUser.followers = [...followers, currentUser._id];
      currentUser.following = [...following, targetUser._id];
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    const followerCount = targetUser.followers.length;
    const followingCount = currentUser.following.length;
    console.log(`[Follow] Success. ${isAlreadyFollower ? 'Unfollowed' : 'Followed'}. Counts: followers=${followerCount}, following=${followingCount}`);

    // Notify target user when someone new follows them
    if (!isAlreadyFollower) {
      const senderHandle = currentUser.handle ? `@${currentUser.handle}` : currentUser.name;
      const isTargetFollowingSender = targetUser.following?.some(id => id && id.toString() === curStr);
      
      const title = isTargetFollowingSender 
        ? `${senderHandle} followed you back!` 
        : `${senderHandle} started following you`;
      
      const subtitle = isTargetFollowingSender
        ? "You're both following each other now!"
        : "Follow them back to stay connected.";

      console.log(`[Follow] Creating notification for ${tgtStr}. Title: ${title}`);

      const notif = await createNotification({
        recipientId: targetUserId,
        senderId: currentUserId,
        type: "follow",
        title,
        subtitle,
        meta: { followerId: currentUserId.toString(), canFollowBack: !isTargetFollowingSender }
      });

      if (notif) {
        console.log(`[Follow] Notification saved. ID: ${notif._id}. Emitting to socket...`);
        emitToUser(String(targetUserId), "notification", {
          id: notif._id.toString(),
          type: "follow",
          title,
          subtitle,
          createdAt: notif.createdAt,
          isRead: false,
          meta: notif.meta,
          sender: {
            id: currentUserId.toString(),
            name: currentUser.name,
            handle: currentUser.handle,
            avatar: currentUser.avatar
          }
        });
      } else {
        console.warn(`[Follow] createNotification returned null for ${tgtStr}`);
      }
    }

    return res.status(200).json({
      success: true,
      following: !isAlreadyFollower,
      followerCount,
      followingCount
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get followers list for a user (basic identity fields only).
 */
exports.getFollowers = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User id is required" });
    }

    const user = await User.findById(userId)
      .populate("followers", "name handle avatar")
      .select("followers");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const followers = (user.followers || []).filter(f => f).map((f) => ({
      id: f._id.toString(),
      name: f.name || "User",
      handle: f.handle || "",
      avatar: f.avatar || null
    }));

    return res.status(200).json({
      success: true,
      count: followers.length,
      followers
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get following list for a user (basic identity fields only).
 */
exports.getFollowing = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User id is required" });
    }

    const user = await User.findById(userId)
      .populate("following", "name handle avatar")
      .select("following");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const following = (user.following || []).filter(f => f).map((f) => ({
      id: f._id.toString(),
      name: f.name || "User",
      handle: f.handle || "",
      avatar: f.avatar || null
    }));

    return res.status(200).json({
      success: true,
      count: following.length,
      following
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


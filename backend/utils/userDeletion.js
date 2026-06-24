const mongoose = require("mongoose");
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const SavedPost = require("../models/SavedPost");
const Story = require("../models/Story");
const Report = require("../models/Report");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const GroupChat = require("../models/GroupChat");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const NFTOffer = require("../models/NFTOffer");
const NFTOwnership = require("../models/NFTOwnership");
const CollectibleOwnership = require("../models/CollectibleOwnership");
const Gift = require("../models/Gift");
const WalletTransaction = require("../models/WalletTransaction");
const Withdrawal = require("../models/Withdrawal");
const KycSubmission = require("../models/KycSubmission");
const CampaignSubmission = require("../models/CampaignSubmission");

/**
 * Permanently deletes a user and cascades the deletion across all related collections.
 * 
 * @param {string|mongoose.Types.ObjectId} userId - The ID of the user to delete.
 */
const deleteUserCascade = async (userId) => {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
  if (!userObjId) throw new Error("Invalid user ID");

  // 1. Delete all posts authored by the user
  await Post.deleteMany({ creator: userObjId });

  // 2. Delete all comments by the user
  await Comment.deleteMany({ author: userObjId });

  // 3. Delete saved posts entries
  await SavedPost.deleteMany({ user: userObjId });

  // 4. Delete stories
  await Story.deleteMany({ user: userObjId });

  // 5. Delete reports created by or targeting the user
  await Report.deleteMany({ $or: [{ reporter: userObjId }, { reportedUser: userObjId }] });

  // 6. Delete notifications involving the user
  await Notification.deleteMany({ $or: [{ recipient: userObjId }, { sender: userObjId }] });

  // 7. Delete messages
  await Message.deleteMany({ $or: [{ sender: userObjId }, { receiver: userObjId }] });

  // 8. Delete Auctions & Bids
  await Auction.deleteMany({ seller: userObjId });
  await Bid.deleteMany({ user: userObjId });

  // 9. Delete NFT Offers and Ownership
  await NFTOffer.deleteMany({ $or: [{ buyer: userObjId }, { seller: userObjId }] });
  await NFTOwnership.deleteMany({ owner: userObjId });
  await CollectibleOwnership.deleteMany({ $or: [{ user: userObjId }, { owner: userObjId }] });

  // 10. Delete Gifts
  await Gift.deleteMany({ $or: [{ sender: userObjId }, { receiver: userObjId }] });

  // 11. Delete Financial records
  await WalletTransaction.deleteMany({ $or: [{ user: userObjId }, { relatedUser: userObjId }] });
  await Withdrawal.deleteMany({ user: userObjId });

  // 12. Delete KYC and Campaign submissions
  await KycSubmission.deleteMany({ userId: userObjId });
  await CampaignSubmission.deleteMany({ user: userObjId });

  // 13. Remove user from social arrays of OTHER users
  await User.updateMany(
    { $or: [{ followers: userObjId }, { following: userObjId }, { dismissedSuggestions: userObjId }] },
    { $pull: { followers: userObjId, following: userObjId, dismissedSuggestions: userObjId } }
  );

  // 14. Remove user from Group Chats
  await GroupChat.updateMany(
    { $or: [{ members: userObjId }, { admins: userObjId }] },
    { $pull: { members: userObjId, admins: userObjId } }
  );

  // 15. Finally, delete the user themselves
  await User.findByIdAndDelete(userObjId);

  // 16. Force client session termination via WebSocket
  try {
    const { emitToUser } = require("./socket");
    emitToUser(String(userId), "force_logout", { reason: "Account deleted by administrator" });
  } catch (err) {
    console.warn("Failed to emit force_logout socket event:", err.message);
  }
};

module.exports = {
  deleteUserCascade
};

const express = require("express");
const router = express.Router();
const messageController = require("../../controllers/user/messageController");
const { protect } = require("../../middleware/authMiddleware");

const { upload } = require("../../utils/upload");

router.get("/conversations", protect, messageController.getConversations);
router.get("/unread-total", protect, messageController.getUnreadTotal);
router.get("/messages/:roomId", protect, messageController.getMessages);
router.post("/upload", protect, upload.single("file"), messageController.uploadMedia);

// New routes for message management
router.delete("/messages/:messageId", protect, messageController.deleteMessage);
router.put("/messages/:messageId", protect, messageController.editMessage);
router.delete("/conversations/:roomId", protect, messageController.deleteChat);
// Group Chat Routes
router.post("/group", protect, messageController.createGroup);
router.get("/groups", protect, messageController.getGroups);
router.get("/group/:groupId", protect, messageController.getGroupDetails);
router.put("/group/:groupId", protect, messageController.updateGroup);
router.post("/group/:groupId/add", protect, messageController.addGroupMembers);
router.post("/group/:groupId/remove", protect, messageController.removeGroupMember);
router.post("/group/:groupId/leave", protect, messageController.leaveGroup);

module.exports = router;

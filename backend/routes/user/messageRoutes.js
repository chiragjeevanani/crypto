const express = require("express");
const router = express.Router();
const messageController = require("../../controllers/user/messageController");
const { protect } = require("../../middleware/authMiddleware");

const { upload } = require("../../utils/upload");

router.get("/conversations", protect, messageController.getConversations);
router.get("/unread-total", protect, messageController.getUnreadTotal);
router.get("/messages/:roomId", protect, messageController.getMessages);
router.post("/upload", protect, upload.single("file"), messageController.uploadMedia);

module.exports = router;

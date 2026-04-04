const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  getSuggestions
} = require("../../controllers/user/notificationController");

const router = express.Router();

router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.get("/suggestions", protect, getSuggestions);
router.post("/read-all", protect, markAllRead);
router.post("/:id/read", protect, markOneRead);

module.exports = router;

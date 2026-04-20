const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { 
    getNotifications, 
    markAsRead, 
    deleteNotification 
} = require("../../controllers/admin/notificationAdminController");

const router = express.Router();
const adminRoles = ["SuperNode", "Admin", "super_admin", "Developer"];
const adminAuth = [protect, authorize(...adminRoles)];

router.get("/", ...adminAuth, getNotifications);
router.patch("/:id/read", ...adminAuth, markAsRead);
router.delete("/:id", ...adminAuth, deleteNotification);

module.exports = router;

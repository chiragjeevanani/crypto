const AdminNotification = require("../../models/AdminNotification");

exports.getNotifications = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            AdminNotification.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            AdminNotification.countDocuments().exec()
        ]);

        const unreadCount = await AdminNotification.countDocuments({ isRead: false });

        return res.status(200).json({
            success: true,
            notifications,
            total,
            unreadCount,
            page,
            limit
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === "all") {
            await AdminNotification.updateMany({ isRead: false }, { isRead: true });
        } else {
            await AdminNotification.findByIdAndUpdate(id, { isRead: true });
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        await AdminNotification.findByIdAndDelete(req.params.id);
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

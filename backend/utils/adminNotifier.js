const AdminConfig = require("../models/AdminConfig");
const AdminNotification = require("../models/AdminNotification");

/**
 * Sends a notification to all configured admin mobile numbers.
 * Also creates an in-app AdminNotification record.
 */
const notifyAdmins = async (message, options = {}) => {
    try {
        // 1. Create in-app AdminNotification
        await AdminNotification.create({
            type: options.type || "system",
            title: options.title || "Admin Alert",
            message: message,
            referenceId: options.referenceId || null
        });

        // 2. Process Mobile Alerts
        const config = await AdminConfig.findOne().exec();
        if (!config || !config.adminNotificationMobiles || config.adminNotificationMobiles.length === 0) {
            console.log("Admin Notifier: No admin mobile numbers configured.");
            return false;
        }

        const mobiles = (config.adminNotificationMobiles || []).filter(m => m && typeof m === 'string' && m.trim() !== '');
        if (mobiles.length === 0) return false;

        console.log(`[ADMIN NOTIFICATION] Sending to ${mobiles.length} admins: "${message}"`);
        
        // Integration point for SMS/WhatsApp API (e.g. Twilio, Gupshup, etc.)
        for (const mobile of mobiles) {
            console.log(`- Notifying ${mobile}...`);
            // await smsService.send(mobile, message); 
        }

        return true;
    } catch (error) {
        console.error("Admin Notifier Error:", error);
        return false;
    }
};

module.exports = { notifyAdmins };

const PromotionSettings = require("../../models/PromotionSettings");

/**
 * Get current promotion settings for admin.
 * GET /api/admin/config/promotion
 */
exports.getSettings = async (req, res) => {
  try {
    let settings = await PromotionSettings.findOne();
    if (!settings) {
      settings = await PromotionSettings.create({});
    }
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update promotion settings.
 * PATCH /api/admin/config/promotion
 */
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    let settings = await PromotionSettings.findOne();
    if (!settings) {
      settings = new PromotionSettings(updates);
    } else {
      Object.assign(settings, updates);
    }
    
    settings.lastUpdatedBy = req.user?.username || "Admin";
    await settings.save();
    
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

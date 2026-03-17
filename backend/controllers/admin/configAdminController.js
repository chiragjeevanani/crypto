const AdminConfig = require("../../models/AdminConfig");
const { DEFAULTS } = require("../../utils/adminConfig");

const getConfig = async (req, res) => {
  try {
    let config = await AdminConfig.findOne().exec();
    if (!config) {
      const created = await AdminConfig.create(DEFAULTS);
      config = created;
    }
    return res.status(200).json({ success: true, config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateConfig = async (req, res) => {
  try {
    const updates = {};
    const fields = ["coinRate", "platformFeePct", "gstPct", "referralLimit", "minWithdrawalCoins"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = Number(req.body[field]);
    });

    let config = await AdminConfig.findOne().exec();
    if (!config) {
      config = await AdminConfig.create({ ...DEFAULTS, ...updates });
    } else {
      Object.assign(config, updates);
      await config.save();
    }
    return res.status(200).json({ success: true, config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getConfig, updateConfig };

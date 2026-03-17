const AdminConfig = require("../models/AdminConfig");

const DEFAULTS = {
  coinRate: 10,
  platformFeePct: 10,
  gstPct: 18,
  referralLimit: 0,
  minWithdrawalCoins: 100
};

const getAdminConfig = async (session = null) => {
  const query = AdminConfig.findOne();
  if (session) query.session(session);
  let config = await query.exec();
  if (!config) {
    const created = await AdminConfig.create([DEFAULTS], session ? { session } : {});
    config = created[0];
  }
  return {
    coinRate: Number(config.coinRate) || DEFAULTS.coinRate,
    platformFeePct: Number(config.platformFeePct) || DEFAULTS.platformFeePct,
    gstPct: Number(config.gstPct) || DEFAULTS.gstPct,
    referralLimit: Number(config.referralLimit) || DEFAULTS.referralLimit,
    minWithdrawalCoins: Number(config.minWithdrawalCoins) || DEFAULTS.minWithdrawalCoins,
    id: config._id
  };
};

module.exports = { getAdminConfig, DEFAULTS };

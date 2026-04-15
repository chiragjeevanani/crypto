const AdminConfig = require("../models/AdminConfig");

const DEFAULTS = {
  coinRate: 1,
  platformFeePct: 10,
  gstPct: 18,
  minReferralsForWithdrawal: 5,
  minWithdrawalCoins: 10,
  premiumThreshold: 100,
  businessPostPriceINR: 499
};

const getAdminConfig = async (session = null) => {
  const query = AdminConfig.findOne();
  if (session) query.session(session);
  let config = await query.exec();
  if (!config) {
    const created = await AdminConfig.create([DEFAULTS], session ? { session } : {});
    config = created[0];
  }
  const obj = config.toObject();
  return {
    ...obj,
    coinRate: Number(obj.coinRate) || DEFAULTS.coinRate,
    platformFeePct: Number(obj.platformFeePct) || DEFAULTS.platformFeePct,
    gstPct: Number(obj.gstPct) || DEFAULTS.gstPct,
    minReferralsForWithdrawal: Number(obj.minReferralsForWithdrawal) || DEFAULTS.minReferralsForWithdrawal,
    minWithdrawalCoins: Number(obj.minWithdrawalCoins) || DEFAULTS.minWithdrawalCoins,
    premiumThreshold: Number(obj.premiumThreshold) || DEFAULTS.premiumThreshold,
    businessPostPriceINR: Number(obj.businessPostPriceINR) || DEFAULTS.businessPostPriceINR,
    id: obj._id
  };
};

module.exports = { getAdminConfig, DEFAULTS };

const AdminConfig = require("../models/AdminConfig");

const DEFAULTS = {
  coinRate: 1,
  platformFeePct: 10,
  gstPct: 18,
  minReferralsForWithdrawal: 5,
  minWithdrawalCoins: 10,
  premiumThreshold: 100,
  businessPostPriceINR: 499,
  auctionListingFeeINR: 500,
  auctionCommissionPct: 10,
  adminNotificationMobiles: []
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
    coinRate: obj.coinRate !== undefined ? Number(obj.coinRate) : DEFAULTS.coinRate,
    platformFeePct: obj.platformFeePct !== undefined ? Number(obj.platformFeePct) : DEFAULTS.platformFeePct,
    gstPct: obj.gstPct !== undefined ? Number(obj.gstPct) : DEFAULTS.gstPct,
    minReferralsForWithdrawal: obj.minReferralsForWithdrawal !== undefined ? Number(obj.minReferralsForWithdrawal) : DEFAULTS.minReferralsForWithdrawal,
    minWithdrawalCoins: obj.minWithdrawalCoins !== undefined ? Number(obj.minWithdrawalCoins) : DEFAULTS.minWithdrawalCoins,
    premiumThreshold: obj.premiumThreshold !== undefined ? Number(obj.premiumThreshold) : DEFAULTS.premiumThreshold,
    businessPostPriceINR: obj.businessPostPriceINR !== undefined ? Number(obj.businessPostPriceINR) : DEFAULTS.businessPostPriceINR,
    auctionListingFeeINR: obj.auctionListingFeeINR !== undefined ? Number(obj.auctionListingFeeINR) : DEFAULTS.auctionListingFeeINR,
    auctionCommissionPct: obj.auctionCommissionPct !== undefined ? Number(obj.auctionCommissionPct) : DEFAULTS.auctionCommissionPct,
    id: obj._id
  };
};

module.exports = { getAdminConfig, DEFAULTS };

const AdminConfig = require("../models/AdminConfig");

const DEFAULTS = {
  coinRate: 1,
  platformFeePct: 10,
  gstPct: 18,
  minReferralsForWithdrawal: 5,
  referralBonusCoins: 100,
  minWithdrawalCoins: 10,
  premiumThreshold: 100,
  businessPostPriceINR: 499,
  auctionListingFeeINR: 500,
  auctionCommissionPct: 10,
  adminNotificationMobiles: [],
  nftTermsAndConditions: "By submitting your NFT to this platform, you confirm that:\n\n1. You are the original creator and rightful owner of this digital asset.\n2. The content does not violate any intellectual property rights.\n3. The content is not obscene, harmful, or illegal.\n4. Your submission will be reviewed by admin before going live.\n5. The platform reserves the right to reject any submission without a refund of any fees.\n6. Once approved, your NFT will be visible in the marketplace.",
  termsAndConditions: "These are the default terms and conditions. Please update them in the admin panel.",
  privacyPolicy: "This is the default privacy policy. Please update it in the admin panel.",
  supportEmail: "support@example.com",
  supportMobile: "",
  faqs: []
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
    referralBonusCoins: obj.referralBonusCoins !== undefined ? Number(obj.referralBonusCoins) : DEFAULTS.referralBonusCoins,
    minWithdrawalCoins: obj.minWithdrawalCoins !== undefined ? Number(obj.minWithdrawalCoins) : DEFAULTS.minWithdrawalCoins,
    premiumThreshold: obj.premiumThreshold !== undefined ? Number(obj.premiumThreshold) : DEFAULTS.premiumThreshold,
    businessPostPriceINR: obj.businessPostPriceINR !== undefined ? Number(obj.businessPostPriceINR) : DEFAULTS.businessPostPriceINR,
    auctionListingFeeINR: obj.auctionListingFeeINR !== undefined ? Number(obj.auctionListingFeeINR) : DEFAULTS.auctionListingFeeINR,
    auctionCommissionPct: obj.auctionCommissionPct !== undefined ? Number(obj.auctionCommissionPct) : DEFAULTS.auctionCommissionPct,
    id: obj._id
  };
};

module.exports = { getAdminConfig, DEFAULTS };

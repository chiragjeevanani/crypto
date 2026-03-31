const WalletTransaction = require("../../models/WalletTransaction");
const User = require("../../models/User");
const Gift = require("../../models/Gift");

const listWalletDeposits = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const query = { type: "deposit" };
    if (req.query.status) query.status = req.query.status;

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      WalletTransaction.countDocuments(query).exec()
    ]);

    const formatted = transactions.map(tx => ({
      id: tx._id.toString(),
      user: tx.userId ? tx.userId.name : "Unknown",
      email: tx.userId ? tx.userId.email : "",
      amount: tx.amount,
      coins: tx.coins,
      status: tx.status,
      date: tx.createdAt,
      referenceId: tx.referenceId
    }));

    return res.status(200).json({ success: true, page, limit, total, transactions: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const listGiftHistory = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    // We only need one side of the gift (sent side) to show the history
    const query = { type: "gift_sent" };

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query)
        .populate("userId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      WalletTransaction.countDocuments(query).exec()
    ]);

    // Manually fetch receiver names for each gift
    const receiverIds = transactions.map(tx => tx.meta?.receiverId).filter(Boolean);
    const receivers = await User.find({ _id: { $in: receiverIds } }, "name").exec();
    const receiverMap = receivers.reduce((acc, u) => {
      acc[u._id.toString()] = u.name;
      return acc;
    }, {});

    // Fetch gift details (icons)
    const giftIds = transactions.map(tx => tx.referenceId).filter(Boolean);
    const giftDetails = await Gift.find({ _id: { $in: giftIds } }, "name icon").exec();
    const giftMap = giftDetails.reduce((acc, g) => {
      acc[g._id.toString()] = { name: g.name, icon: g.icon };
      return acc;
    }, {});

    const formatted = transactions.map(tx => ({
      id: tx._id.toString(),
      sender: tx.userId ? tx.userId.name : "Unknown",
      receiver: tx.meta?.receiverId ? (receiverMap[tx.meta.receiverId.toString()] || "Deleted User") : "Unknown",
      coins: tx.coins,
      giftName: tx.referenceId ? (giftMap[tx.referenceId]?.name || "Gift") : "Gift",
      giftIcon: tx.referenceId ? (giftMap[tx.referenceId]?.icon || "🎁") : "🎁",
      date: tx.createdAt,
      postId: tx.meta?.postId || null,
      reelId: tx.meta?.reelId || null
    }));

    return res.status(200).json({ success: true, page, limit, total, history: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listWalletDeposits,
  listGiftHistory
};

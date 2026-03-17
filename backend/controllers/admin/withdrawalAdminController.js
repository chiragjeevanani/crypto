const mongoose = require("mongoose");
const Withdrawal = require("../../models/Withdrawal");
const WalletTransaction = require("../../models/WalletTransaction");
const User = require("../../models/User");

const listWithdrawals = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;
    const query = {};

    if (req.query.status) query.status = req.query.status;
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) query.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) query.createdAt.$lte = new Date(req.query.to);
    }

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Withdrawal.countDocuments(query).exec()
    ]);

    return res.status(200).json({ success: true, page, limit, total, withdrawals });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.body;
    if (!withdrawalId) {
      return res.status(400).json({ success: false, message: "withdrawalId is required" });
    }

    const session = await mongoose.startSession();
    let updatedWithdrawal;
    try {
      await session.withTransaction(async () => {
        const withdrawal = await Withdrawal.findById(withdrawalId).session(session);
        if (!withdrawal) throw new Error("Withdrawal not found");
        if (withdrawal.status !== "pending") throw new Error("Withdrawal already processed");

        const user = await User.findById(withdrawal.userId).session(session);
        if (!user) throw new Error("User not found");

        const beforeBalance = Number(user.earningCoins || 0);
        if (beforeBalance < withdrawal.coins) {
          throw new Error("Insufficient earning coins");
        }

        user.earningCoins = beforeBalance - withdrawal.coins;
        await user.save({ session });

        withdrawal.status = "success";
        withdrawal.processedAt = new Date();
        await withdrawal.save({ session });

        const tx = await WalletTransaction.findOne({
          userId: withdrawal.userId,
          type: "withdrawal",
          referenceId: withdrawal._id.toString()
        }).session(session);
        if (tx) {
          tx.status = "success";
          tx.beforeBalance = beforeBalance;
          tx.afterBalance = beforeBalance - withdrawal.coins;
          await tx.save({ session });
        }

        updatedWithdrawal = withdrawal;
      });
    } finally {
      session.endSession();
    }

    return res.status(200).json({ success: true, withdrawal: updatedWithdrawal });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const rejectWithdrawal = async (req, res) => {
  try {
    const { withdrawalId, reason } = req.body;
    if (!withdrawalId) {
      return res.status(400).json({ success: false, message: "withdrawalId is required" });
    }

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Withdrawal not found" });
    }
    if (withdrawal.status !== "pending") {
      return res.status(400).json({ success: false, message: "Withdrawal already processed" });
    }

    withdrawal.status = "rejected";
    withdrawal.rejectionReason = reason || "";
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    await WalletTransaction.updateOne(
      {
        userId: withdrawal.userId,
        type: "withdrawal",
        referenceId: withdrawal._id.toString()
      },
      { $set: { status: "failed" } }
    );

    return res.status(200).json({ success: true, withdrawal });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
};

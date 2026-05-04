const mongoose = require("mongoose");
const User = require("../../models/User");
const Gift = require("../../models/Gift");
const WalletTransaction = require("../../models/WalletTransaction");
const Withdrawal = require("../../models/Withdrawal");
const KycSubmission = require("../../models/KycSubmission");
const { getAdminConfig } = require("../../utils/adminConfig");
const { createNotification } = require("./notificationController");
const { emitToUser, broadcastAll } = require("../../utils/socket");
const { notifyAdmins } = require("../../utils/adminNotifier");
const { getCachedRates } = require("../../utils/exchangeRate");
const { buildCurrencyMeta } = require("../../utils/currencyConverter");

const getIdempotencyKey = (req) =>
  (req.headers["idempotency-key"] || req.body.idempotencyKey || "").toString().trim() || null;

const parsePositiveNumber = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
};

const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("rechargeCoins earningCoins");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const rechargeCoins = Number(user.rechargeCoins || 0);
    const earningCoins = Number(user.earningCoins || 0);
    return res.status(200).json({
      success: true,
      rechargeCoins,
      earningCoins,
      totalCoins: rechargeCoins + earningCoins
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deposit = async (req, res) => {
  const userId = req.user.userId;
  try {
    const bodyUserId = req.body.userId ? String(req.body.userId) : null;
    if (bodyUserId && bodyUserId !== String(userId)) {
      return res.status(403).json({ success: false, message: "User mismatch" });
    }
    const amount = parsePositiveNumber(req.body.amount);
    if (!amount) {
      return res.status(400).json({ success: false, message: "Amount must be a positive number" });
    }

    const idempotencyKey = getIdempotencyKey(req);
    if (idempotencyKey) {
      const existing = await WalletTransaction.findOne({
        userId,
        type: "deposit",
        idempotencyKey
      }).exec();
      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Deposit already processed",
          transaction: existing
        });
      }
    }

    const session = await mongoose.startSession();
    let transaction;
    try {
      await session.withTransaction(async () => {
        const config = await getAdminConfig(session);
        const coinRate = Math.max(0, Number(config.coinRate) || 0);
        const coins = Math.round(amount * coinRate);
        if (coins <= 0) {
          throw new Error("Coin conversion resulted in zero coins");
        }
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error("User not found");

        const beforeBalance = Number(user.rechargeCoins || 0);
        const afterBalance = beforeBalance + coins;
        user.rechargeCoins = afterBalance;
        await user.save({ session });

        const [created] = await WalletTransaction.create(
          [
            {
              userId,
              type: "deposit",
              coins,
              amount,
              beforeBalance,
              afterBalance,
              referenceId: "",
              referenceType: "deposit",
              status: "success",
              idempotencyKey,
              meta: { coinRate }
            }
          ],
          { session }
        );
        transaction = created;
      });
    } finally {
      session.endSession();
    }

    return res.status(201).json({
      success: true,
      message: "Deposit successful",
      transaction
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const sendGift = async (req, res) => {
  const senderId = req.user.userId;
  try {
    const { giftId, receiverId, postId, reelId } = req.body;
    if (!giftId || !receiverId) {
      return res.status(400).json({ success: false, message: "giftId and receiverId are required" });
    }
    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ success: false, message: "Cannot send gift to yourself" });
    }

    const idempotencyKey = getIdempotencyKey(req);
    if (idempotencyKey) {
      const existing = await WalletTransaction.findOne({
        userId: senderId,
        type: "gift_sent",
        idempotencyKey
      }).exec();
      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Gift already processed",
          transaction: existing
        });
      }
    }

    const session = await mongoose.startSession();
    let debitTx;
    let creditTx;
    let sender, receiver, gift, coinValue;

    try {
      await session.withTransaction(async () => {
        gift = await Gift.findById(giftId).session(session);
        if (!gift || gift.status !== "Active") {
          throw new Error("Gift not available");
        }

        sender = await User.findById(senderId).session(session);
        if (!sender) throw new Error("Sender not found");

        // Determine price based on sender's region
        const isInr = (sender.currencyCode || "INR") === "INR";
        coinValue = isInr ? Number(gift.priceInr || gift.price || 0) : Number(gift.priceGlobal || 0);

        if (coinValue <= 0) throw new Error("Gift value invalid for your region");

        receiver = await User.findById(receiverId).session(session);
        if (!receiver) throw new Error("Receiver not found");

        const senderBefore = Number(sender.rechargeCoins || 0);
        if (senderBefore < coinValue) {
          throw new Error("Insufficient recharge coins");
        }
        const receiverBefore = Number(receiver.earningCoins || 0);

        const senderUpdate = await User.updateOne(
          { _id: senderId, rechargeCoins: { $gte: coinValue } },
          { $inc: { rechargeCoins: -coinValue } },
          { session }
        );
        if (!senderUpdate.modifiedCount) throw new Error("Insufficient recharge coins");

        const receiverAfter = receiverBefore + coinValue;
        const config = await getAdminConfig(session);
        const threshold = Number(config.premiumThreshold || 100);

        const updateData = { $inc: { earningCoins: coinValue } };
        if (!receiver.isPremium && receiverAfter >= threshold) {
          updateData.$set = { isPremium: true };
        }

        await User.updateOne(
          { _id: receiverId },
          updateData,
          { session }
        );

        await Gift.updateOne({ _id: giftId }, { $inc: { usage: 1 } }, { session });

        const senderAfter = senderBefore - coinValue;
        const referenceId = String(giftId);

        const [sentTx, receivedTx] = await WalletTransaction.create(
          [
            {
              userId: senderId,
              type: "gift_sent",
              coins: coinValue,
              amount: null,
              beforeBalance: senderBefore,
              afterBalance: senderAfter,
              referenceId,
              referenceType: "gift",
              status: "success",
              idempotencyKey,
              meta: { 
                receiverId, 
                receiverName: receiver.name || receiver.username,
                receiverHandle: receiver.handle,
                postId, 
                reelId 
              }
            },
            {
              userId: receiverId,
              type: "gift_received",
              coins: coinValue,
              amount: null,
              beforeBalance: receiverBefore,
              afterBalance: receiverAfter,
              referenceId,
              referenceType: "gift",
              status: "success",
              meta: { 
                senderId, 
                senderName: sender.name || sender.username,
                senderHandle: sender.handle,
                postId, 
                reelId 
              }
            }
          ],
          { session, ordered: true }
        );
        debitTx = sentTx;
        creditTx = receivedTx;
      });
    } finally {
      session.endSession();
    }

    // --- Fetch live rates & build localized currency metadata ---
    // Direct formula: gift.price (INR) → sender/receiver's own currency via live API rates
    let senderCurrencyMeta = null;
    let receiverCurrencyMeta = null;
    try {
      const { rates, source, lastUpdate } = await getCachedRates();
      // Use the sender's price for calculation
      const isSenderInr = (sender.currencyCode || "INR") === "INR";
      const giftPriceBasis = isSenderInr ? Number(gift.priceInr || gift.price || 0) : Number(gift.priceGlobal || 0);

      // Log exactly which source and rates are being used — verifiable in server console
      console.log(`[Gift][Currency] Rate source: ${source} | Updated: ${lastUpdate}`);
      console.log(`[Gift][Currency] Gift price basis: ${giftPriceBasis} ${isSenderInr ? 'INR' : 'Global'}`);
      console.log(`[Gift][Currency] API rates used — INR: ${rates['INR']} | Sender(${sender.currencyCode}): ${rates[sender.currencyCode] ?? 'N/A'} | Receiver(${receiver.currencyCode}): ${rates[receiver.currencyCode] ?? 'N/A'}`);

      // Sender sees how much they spent in their own currency
      senderCurrencyMeta = buildCurrencyMeta(
        giftPriceBasis,
        sender.currencyCode || 'INR',
        sender.currencySymbol || '₹',
        rates
      );

      // Receiver sees how much they received in their own currency
      receiverCurrencyMeta = buildCurrencyMeta(
        giftPriceBasis,
        receiver.currencyCode || 'INR',
        receiver.currencySymbol || '₹',
        rates
      );

      console.log(`[Gift][Currency] Result — Sender: ${senderCurrencyMeta.formatted} | Receiver: ${receiverCurrencyMeta.formatted}`);

      // Patch localized meta onto both transaction records (best-effort)
      await WalletTransaction.findByIdAndUpdate(debitTx._id, {
        $set: { 
          'meta.localAmount': senderCurrencyMeta.localAmount,
          'meta.localCurrency': senderCurrencyMeta.localCurrency,
          'meta.localSymbol': senderCurrencyMeta.localSymbol,
          'meta.inrAmount': senderCurrencyMeta.inrAmount,
          'meta.rateSource': source
        }
      });
      await WalletTransaction.findByIdAndUpdate(creditTx._id, {
        $set: { 
          'meta.localAmount': receiverCurrencyMeta.localAmount,
          'meta.localCurrency': receiverCurrencyMeta.localCurrency,
          'meta.localSymbol': receiverCurrencyMeta.localSymbol,
          'meta.inrAmount': receiverCurrencyMeta.inrAmount,
          'meta.rateSource': source
        }
      });
    } catch (e) {
      console.error('[Gift] Currency conversion failed (non-critical):', e.message);
    }


    // --- Persist notification for receiver & emit live event ---
    const senderHandle = sender.handle ? `@${sender.handle}` : sender.name;
    const receiverHandle = receiver.handle ? `@${receiver.handle}` : receiver.name;
    const giftEmoji = gift.icon || "🎁";
    const notifType = gift.name?.toLowerCase().includes("heart") ? "follower_broadcast" : "gift";
    const notifTitle = `${senderHandle} sent a ${giftEmoji} ${gift.name} to ${receiverHandle}`;

    // Build subtitle with localized amount for receiver
    const receiverAmountDisplay = receiverCurrencyMeta?.formatted
      ? ` (${receiverCurrencyMeta.formatted})`
      : '';
    const notifSubtitle =
      notifType === "follower_broadcast"
        ? "Broadcast sent to 100 followers to boost engagement."
        : `You received a premium ${gift.name}!${receiverAmountDisplay}`;

    const savedNotif = await createNotification({
      recipientId: receiverId,
      senderId: senderId,
      type: notifType,
      title: notifTitle,
      subtitle: notifSubtitle,
      meta: { 
        postId, reelId, 
        giftName: gift.name, giftIcon: giftEmoji, 
        coins: coinValue,
        // Receiver's localized amount
        localAmount: receiverCurrencyMeta?.localAmount,
        localCurrency: receiverCurrencyMeta?.localCurrency,
        localSymbol: receiverCurrencyMeta?.localSymbol,
        formatted: receiverCurrencyMeta?.formatted
      }
    });

    // Push real-time private notification to receiver
    if (savedNotif) {
      emitToUser(String(receiverId), "notification", {
        id: savedNotif._id.toString(),
        type: notifType,
        title: notifTitle,
        subtitle: notifSubtitle,
        createdAt: savedNotif.createdAt,
        isRead: false,
        meta: savedNotif.meta
      });
    }

    // Global broadcast — if gift price >= 5, announce to ALL online users (and save in history)
    if (gift.price >= 5) {
      const broadcastTitle = `${receiverHandle} received a ${giftEmoji} ${gift.name} from ${senderHandle}!`;
      const broadcastSubtitle = `Join the post to show your support.`;
      
      const globalNotif = await createNotification({
        type: "follower_broadcast",
        title: broadcastTitle,
        subtitle: broadcastSubtitle,
        meta: { postId, giftName: gift.name, giftIcon: giftEmoji, price: gift.price },
        isGlobal: true
      });

      broadcastAll("notification_broadcast", {
        id: globalNotif?._id.toString() || `broadcast_${Date.now()}`,
        type: "follower_broadcast",
        title: broadcastTitle,
        subtitle: broadcastSubtitle,
        createdAt: globalNotif?.createdAt || new Date().toISOString(),
        isRead: false,
        meta: { postId, giftName: gift.name, giftIcon: giftEmoji, price: gift.price }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Gift sent successfully",
      debitTransaction: debitTx,
      creditTransaction: creditTx
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const listTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const query = { userId };
    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;

    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) query.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) query.createdAt.$lte = new Date(req.query.to);
    }

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      WalletTransaction.countDocuments(query).exec()
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      transactions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const withdraw = async (req, res) => {
  console.log(`[Wallet] ENTERING withdraw controller for user: ${req.user?.userId}`);
  const userId = req.user.userId;
  console.log(`[Wallet] Withdrawal request for user: ${userId}`);
  try {
    const bodyUserId = req.body.userId ? String(req.body.userId) : null;
    if (bodyUserId && bodyUserId !== String(userId)) {
      return res.status(403).json({ success: false, message: "User mismatch" });
    }
    const coins = parsePositiveNumber(req.body.coins);
    if (!coins) {
      return res.status(400).json({ success: false, message: "Coins must be a positive number" });
    }

    const idempotencyKey = getIdempotencyKey(req);
    if (idempotencyKey) {
      const existing = await Withdrawal.findOne({ userId, idempotencyKey }).exec();
      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Withdrawal already requested",
          withdrawal: existing
        });
      }
    }

    const session = await mongoose.startSession();
    let withdrawal;
    try {
      await session.withTransaction(async () => {
        const config = await getAdminConfig(session);
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error("User not found");
        if (!user.isMonetized) throw new Error("User is not monetized");
        const earningCoins = Number(user.earningCoins || 0);
        if (earningCoins < coins) throw new Error("Insufficient earning coins");
        if (coins < Number(config.minWithdrawalCoins || 0)) {
          throw new Error(`Minimum withdrawal amount is ${config.minWithdrawalCoins} RS`);
        }
        
        // Enforce sharing/referral requirement
        const requiredReferrals = Number(config.minReferralsForWithdrawal || 0);
        if (Number(user.referralCount || 0) < requiredReferrals) {
          throw new Error(`You must refer at least ${requiredReferrals} members before withdrawing. (Your count: ${user.referralCount || 0})`);
        }

        let { 
          paymentMethod, 
          bankDetails, 
          upiId, 
          kycDetails, 
          documents 
        } = req.body;

        if (!paymentMethod) throw new Error("Payment method is required");
        if (paymentMethod === "bank") {
          if (!bankDetails?.accountNumber || !bankDetails?.ifscCode || !bankDetails?.accountHolderName) {
            throw new Error("Complete bank details are required");
          }
        } else if (paymentMethod === "upi") {
          if (!upiId) throw new Error("UPI ID is required");
        } else {
          throw new Error("Invalid payment method");
        }

        // Auto-fetch KYC from verified submission if missing in body
        if (!kycDetails?.aadharNumber) {
            console.log(`[Wallet] KYC details missing in body, fetching from verified submission for user: ${userId}`);
            const verifiedKyc = await KycSubmission.findOne({ userId, status: 'verified' }).session(session);
            if (verifiedKyc) {
                kycDetails = {
                    aadharNumber: verifiedKyc.aadharNumber,
                    panNumber: verifiedKyc.panNumber
                };
                documents = {
                    aadharFrontUrl: verifiedKyc.documents?.aadharFrontUrl,
                    aadharBackUrl: verifiedKyc.documents?.aadharBackUrl,
                    panCardUrl: verifiedKyc.documents?.panCardUrl
                };
                console.log(`[Wallet] Found verified KYC for user: ${userId}`);
            } else {
                throw new Error("Verified KYC documentation is required to initiate a payout. Please complete your verification first.");
            }
        }

        if (!kycDetails?.aadharNumber) throw new Error("Aadhar number is required for withdrawal");

        const coinRate = Math.max(0, Number(config.coinRate) || 0);
        if (coinRate <= 0) throw new Error("Invalid coin rate");
        const grossAmount = coins / coinRate;
        const platformFee = (grossAmount * Number(config.platformFeePct || 0)) / 100;
        const gst = (grossAmount * Number(config.gstPct || 0)) / 100;
        const finalAmount = Math.max(0, grossAmount - platformFee - gst);

        const [createdWithdrawal] = await Withdrawal.create(
          [
            {
              userId,
              coins,
              coinRate,
              grossAmount,
              platformFee,
              gst,
              finalAmount,
              paymentMethod,
              bankDetails: paymentMethod === "bank" ? bankDetails : undefined,
              upiId: paymentMethod === "upi" ? upiId : undefined,
              kycDetails,
              documents,
              status: "pending",
              idempotencyKey
            }
          ],
          { session }
        );

        const beforeBalance = earningCoins;
        // const afterBalance = earningCoins - coins;
        
        // Deduction moved to Admin Approval step per user requirement
        // user.earningCoins = afterBalance;
        // await user.save({ session });

        await WalletTransaction.create(
          [
            {
              userId,
              type: "withdrawal",
              coins,
              amount: finalAmount,
              beforeBalance,
              afterBalance: beforeBalance,
              referenceId: createdWithdrawal._id.toString(),
              referenceType: "withdrawal",
              status: "pending",
              idempotencyKey,
              meta: { grossAmount, platformFee, gst, coinRate }
            }
          ],
          { session }
        );

        withdrawal = createdWithdrawal;
      });
    } finally {
      session.endSession();
    }

    // Notify Admins for Withdrawal Request
    try {
        const user = await User.findById(userId).select("name handle");
        await notifyAdmins(`Withdrawal request of ₹${withdrawal.finalAmount.toFixed(2)} (${withdrawal.coins} coins) submitted by ${user?.name || 'User'} (${user?.handle || '@user'}). Please review and approve.`, {
            type: "withdrawal_request",
            title: "New Withdrawal Request",
            referenceId: withdrawal._id
        });
    } catch (err) {
        console.error("Error in withdrawal notification:", err);
    }

    return res.status(201).json({
      success: true,
      message: "Withdrawal request created",
      withdrawal
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const listActiveGifts = async (req, res) => {
  try {
    const gifts = await Gift.find({ status: "Active" })
      .sort({ price: 1 })
      .exec();
    return res.status(200).json({
      success: true,
      gifts: gifts.map(g => ({
        id: g._id.toString(),
        name: g.name,
        icon: g.icon || "🎁",
        price: g.price,
        priceInr: g.priceInr || g.price,
        priceGlobal: g.priceGlobal || 0,
        value: g.value,
        usage: g.usage || 0,
        soundUrl: g.soundUrl
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBalance,
  deposit,
  sendGift,
  listActiveGifts,
  listTransactions,
  withdraw
};

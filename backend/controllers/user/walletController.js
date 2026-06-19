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
const { buildCurrencyMeta, convertFromUSD } = require("../../utils/currencyConverter");

const getIdempotencyKey = (req) =>
  (req.headers["idempotency-key"] || req.body.idempotencyKey || "").toString().trim() || null;

const parsePositiveNumber = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
};

const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("rechargeCoins earningCoins currencyCode");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const rechargeCoins = Number(user.rechargeCoins || 0);
    const earningCoins = Number(user.earningCoins || 0);
    
    let localRate = 1;
    const currencyCode = user.currencyCode || "INR";
    if (currencyCode !== "INR") {
      const { rates } = await getCachedRates();
      const inrRate = rates["INR"];
      const targetRate = rates[currencyCode];
      if (inrRate && targetRate) {
        localRate = targetRate / inrRate;
      }
    }

    const giftStats = await WalletTransaction.aggregate([
      { $match: { userId: user._id, type: "gift_received", status: "success" } },
      { $group: { _id: null, total: { $sum: "$coins" }, count: { $sum: 1 } } }
    ]);
    const giftEarningsVal = giftStats[0]?.total || 0;
    const giftCountVal = giftStats[0]?.count || 0;

    const nftStats = await WalletTransaction.aggregate([
      { $match: { userId: user._id, referenceType: "auction_sale", status: "success" } },
      { $group: { _id: null, total: { $sum: "$coins" }, count: { $sum: 1 } } }
    ]);
    const nftEarningsVal = nftStats[0]?.total || 0;
    const nftCountVal = nftStats[0]?.count || 0;

    // For tasks, check if CampaignSubmission exists
    const CampaignSubmission = require("../../models/CampaignSubmission");
    const taskStats = await CampaignSubmission.countDocuments({ user: user._id, isVerified: true });
    // Assuming a verified task gives some coins, we can either return the count or derive earnings
    // If no explicit task transaction exists, we just send the count and let frontend handle it or send 0 earnings
    const taskCountVal = taskStats || 0;
    // Derive task earnings as the remaining balance
    const taskEarningsVal = 0;

    return res.status(200).json({
      success: true,
      rechargeCoins,
      earningCoins,
      totalCoins: rechargeCoins + earningCoins,
      localRate,
      giftEarnings: giftEarningsVal,
      taskEarnings: taskEarningsVal,
      nftEarnings: nftEarningsVal,
      giftCount: giftCountVal,
      taskCount: taskCountVal,
      nftCount: nftCountVal
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
    let sender, receiver, gift, deductAmount, creditAmount, debitTx, creditTx;
    const { rates, source, lastUpdate } = await getCachedRates();

    try {
      await session.withTransaction(async () => {
        gift = await Gift.findById(giftId).session(session);
        if (!gift || gift.status !== "Active") {
          throw new Error("Gift not available");
        }

        sender = await User.findById(senderId).session(session);
        if (!sender) throw new Error("Sender not found");

        receiver = await User.findById(receiverId).session(session);
        if (!receiver) throw new Error("Receiver not found");

        const senderCurrency = sender.currencyCode || "INR";
        const receiverCurrency = receiver.currencyCode || "INR";

        // 1. Determine how much the sender pays in their LOCAL currency
        let localPricePaid;
        if (senderCurrency === "INR") {
            localPricePaid = gift.priceInr || 1;
        } else {
            // Everyone else pays the Global price in their local currency value
            localPricePaid = gift.priceGlobal || gift.priceUsd || 1;
        }

        // 2. Convert that local payment to INR base (since wallets store coins in INR base)
        const inrRate = rates["INR"] || 80;
        const senderRate = rates[senderCurrency] || 1;
        
        // Convert to USD first, then to INR
        const baseUsdOfTx = localPricePaid / senderRate;
        deductAmount = parseFloat((baseUsdOfTx * inrRate).toFixed(2));

        // 3. The receiver gets the exact same INR base value in their earningCoins
        creditAmount = deductAmount;
        
        if (creditAmount <= 0) throw new Error("Conversion error for receiver");

        const senderBefore = Number(sender.rechargeCoins || 0);
        if (senderBefore < deductAmount) {
          throw new Error(`Insufficient balance. You need ${sender.currencySymbol}${deductAmount} but have ${sender.currencySymbol}${senderBefore}`);
        }
        const receiverBefore = Number(receiver.earningCoins || 0);

        const senderUpdate = await User.updateOne(
          { _id: senderId, rechargeCoins: { $gte: deductAmount } },
          { $inc: { rechargeCoins: -deductAmount } },
          { session }
        );
        if (!senderUpdate.modifiedCount) throw new Error("Insufficient balance");

        const receiverAfter = receiverBefore + creditAmount;
        const config = await getAdminConfig(session);
        const threshold = Number(config.premiumThreshold || 100);

        const updateData = { $inc: { earningCoins: creditAmount } };
        if (!receiver.isPremium && receiverAfter >= threshold) {
          updateData.$set = { isPremium: true };
        }

        await User.updateOne({ _id: receiverId }, updateData, { session });
        await Gift.updateOne({ _id: giftId }, { $inc: { usage: 1 } }, { session });

        const senderAfter = senderBefore - deductAmount;
        const referenceId = String(giftId);

        const [sentTx, receivedTx] = await WalletTransaction.create(
          [
            {
              userId: senderId,
              type: "gift_sent",
              coins: deductAmount,
              amount: deductAmount,
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
                reelId,
                basePriceUsd: baseUsdOfTx,
                localCurrency: sender.currencyCode,
                localSymbol: sender.currencySymbol,
                exchangeRate: rates[sender.currencyCode],
                rateSource: source,
                rateDate: lastUpdate
              }
            },
            {
              userId: receiverId,
              type: "gift_received",
              coins: creditAmount,
              amount: creditAmount,
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
                reelId,
                basePriceUsd: baseUsdOfTx,
                localCurrency: receiver.currencyCode,
                localSymbol: receiver.currencySymbol,
                exchangeRate: rates[receiver.currencyCode],
                rateSource: source,
                rateDate: lastUpdate
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

    try {
      const senderHandle = sender.handle ? `@${sender.handle}` : sender.name;
      const receiverHandle = receiver.handle ? `@${receiver.handle}` : receiver.name;
      const giftEmoji = gift.icon || "🎁";
      const notifType = gift.name?.toLowerCase().includes("heart") ? "follower_broadcast" : "gift";
      const notifTitle = `${senderHandle} sent a ${giftEmoji} ${gift.name} to ${receiverHandle}`;
      
      const receiverAmountFormatted = `${receiver.currencySymbol}${creditAmount.toFixed(2)}`;
      const notifSubtitle = notifType === "follower_broadcast"
          ? "Broadcast sent to 100 followers to boost engagement."
          : `You received a premium ${gift.name}! (${receiverAmountFormatted})`;

      const savedNotif = await createNotification({
        recipientId: receiverId,
        senderId: senderId,
        type: notifType,
        title: notifTitle,
        subtitle: notifSubtitle,
        meta: { 
          postId, reelId, 
          giftName: gift.name, giftIcon: giftEmoji, 
          amount: creditAmount,
          currency: receiver.currencyCode,
          formatted: receiverAmountFormatted
        }
      });

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

      if (baseUsdOfTx >= 5) {
        const broadcastTitle = `${receiverHandle} received a ${giftEmoji} ${gift.name} from ${senderHandle}!`;
        const broadcastSubtitle = `Join the post to show your support.`;
        
        const globalNotif = await createNotification({
          type: "follower_broadcast",
          title: broadcastTitle,
          subtitle: broadcastSubtitle,
          meta: { postId, giftName: gift.name, giftIcon: giftEmoji, priceUsd: baseUsdOfTx },
          isGlobal: true
        });

        broadcastAll("notification_broadcast", {
          id: globalNotif?._id.toString() || `broadcast_${Date.now()}`,
          type: "follower_broadcast",
          title: broadcastTitle,
          subtitle: broadcastSubtitle,
          createdAt: globalNotif?.createdAt || new Date().toISOString(),
          isRead: false,
          meta: { postId, giftName: gift.name, giftIcon: giftEmoji, priceUsd: baseUsdOfTx }
        });
      }
    } catch (err) {
      console.error("[Gift] Notification/Broadcast error:", err.message);
    }

    return res.status(200).json({
      success: true,
      message: "Gift sent successfully",
      deductAmount,
      creditAmount,
      currency: sender.currencyCode,
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
  const userId = req.user.userId;
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
    const user = await User.findById(req.user.userId).select("currencyCode currencySymbol");
    const { rates } = await getCachedRates();
    const currencyCode = user?.currencyCode || "INR";
    const currencySymbol = user?.currencySymbol || "₹";

    const gifts = await Gift.find({ status: "Active" })
      .sort({ priceInr: 1 })
      .exec();

    const mappedGifts = gifts.map(g => {
      // 1. Determine the ground-truth USD price
      const baseUsd = g.priceGlobal || g.priceUsd || (g.priceInr ? g.priceInr / 80 : 0) || 1;
      
      // 2. Determine the local display price - STRICTLY follow admin definitions
      let localPrice;
      
      if (currencyCode === "INR") {
        // Use exact INR price defined by admin (fallback to 1 if not set)
        localPrice = g.priceInr || 1;
      } else {
        // For all other regions (Global), use the exact Global price defined by admin
        // This ensures a gift set to "Global: 10" shows as "10" everywhere outside India
        localPrice = g.priceGlobal || baseUsd;
      }
      
      return {
        id: g._id.toString(),
        name: g.name,
        icon: g.icon || "🎁",
        priceUsd: baseUsd,
        priceLocal: localPrice,
        currencySymbol: currencySymbol,
        currencyCode: currencyCode,
        value: g.value || g.priceInr || 0,
        usage: g.usage || 0,
        soundUrl: g.soundUrl
      };
    });

    return res.status(200).json({
      success: true,
      gifts: mappedGifts
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPayoutMethods = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("payoutMethods");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, payoutMethods: user.payoutMethods || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addPayoutMethod = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    const { type, upiId, holderName, accountNumber, ifscCode, bankName, primary } = req.body;
    
    if (type === 'upi' && !upiId) return res.status(400).json({ success: false, message: "UPI ID is required" });
    if (type === 'bank' && (!accountNumber || !ifscCode || !holderName)) return res.status(400).json({ success: false, message: "Complete bank details are required" });

    // If making this primary, unset others
    if (primary) {
      user.payoutMethods.forEach(pm => pm.primary = false);
    }
    
    // If it's the only method, make it primary automatically
    const isFirst = !user.payoutMethods || user.payoutMethods.length === 0;

    user.payoutMethods.push({
      type,
      upiId,
      holderName,
      accountNumber,
      ifscCode,
      bankName,
      primary: primary || isFirst
    });

    await user.save();
    return res.status(201).json({ success: true, payoutMethods: user.payoutMethods });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removePayoutMethod = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    const methodId = req.params.id;
    user.payoutMethods = user.payoutMethods.filter(pm => pm._id.toString() !== methodId);
    
    // If we removed the primary one, make the first remaining one primary
    if (user.payoutMethods.length > 0 && !user.payoutMethods.some(pm => pm.primary)) {
      user.payoutMethods[0].primary = true;
    }

    await user.save();
    return res.status(200).json({ success: true, payoutMethods: user.payoutMethods });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const setPrimaryPayoutMethod = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    const methodId = req.params.id;
    let found = false;
    user.payoutMethods.forEach(pm => {
      if (pm._id.toString() === methodId) {
        pm.primary = true;
        found = true;
      } else {
        pm.primary = false;
      }
    });

    if (!found) return res.status(404).json({ success: false, message: "Payout method not found" });

    await user.save();
    return res.status(200).json({ success: true, payoutMethods: user.payoutMethods });
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
  withdraw,
  getPayoutMethods,
  addPayoutMethod,
  removePayoutMethod,
  setPrimaryPayoutMethod
};

const User = require("../../models/User");
const WalletTransaction = require("../../models/WalletTransaction");
const { getAdminConfig } = require("../../utils/adminConfig");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const initiateRecharge = async (req, res) => {
    const userId = req.user.userId;
    const { amount } = req.body;

    try {
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const config = await getAdminConfig();
        const coinRate = Number(config.coinRate);
        const coins = Math.round(amount * coinRate);

        // Razorpay Instance
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: Math.round(amount * 100), // Razorpay takes amount in Paise
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
        };

        try {
            const order = await instance.orders.create(options);
            
            // Create a pending transaction
            const transaction = await WalletTransaction.create({
                userId,
                type: "deposit",
                coins,
                amount,
                beforeBalance: user.rechargeCoins,
                afterBalance: user.rechargeCoins,
                status: "pending",
                referenceId: order.id,
                idempotencyKey: order.id,
                referenceType: "payment_gateway",
                meta: { 
                    coinRate,
                    country: user.countryCode,
                    currency: user.currencyCode,
                    orderId: order.id
                }
            });

            return res.status(200).json({
                success: true,
                gateway: "razorpay",
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
                transactionId: transaction._id,
                message: "Razorpay order initiated"
            });
        } catch (razorError) {
            console.error("Razorpay Order Error:", razorError);
            return res.status(500).json({ success: false, message: "Payment initialization failed", detail: razorError.message });
        }
    } catch (error) {
        console.error("Critical Rebrand Initiation Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const verifyPayment = async (req, res) => {
    const { 
        transactionId, 
        razorpay_payment_id, 
        razorpay_order_id, 
        razorpay_signature 
    } = req.body;

    try {
        const transaction = await WalletTransaction.findById(transactionId);
        if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });

        if (transaction.status === "success") {
            return res.status(200).json({ success: true, message: "Already processed" });
        }

        // Verify Signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            transaction.status = "failed";
            await transaction.save();
            return res.status(400).json({ success: false, message: "Payment verification failed: Signature mismatch" });
        }

        // Update Wallet
        const user = await User.findById(transaction.userId);
        if (!user) throw new Error("User associated with transaction not found");

        const before = user.rechargeCoins;
        user.rechargeCoins += transaction.coins;
        await user.save();

        transaction.status = "success";
        transaction.beforeBalance = before;
        transaction.afterBalance = user.rechargeCoins;
        transaction.meta = { ...transaction.meta, paymentId: razorpay_payment_id };
        await transaction.save();

        return res.status(200).json({ success: true, message: "Payment verified and wallet updated" });
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const handleCallback = async (req, res) => {
    // Razorpay usually handles callbacks via Webhooks or Frontend callback
    // We can keep this empty or handle Webhooks here later
    res.status(200).json({ success: true });
};

module.exports = {
    initiateRecharge,
    verifyPayment,
    handleCallback
};


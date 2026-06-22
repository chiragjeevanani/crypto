const User = require("../../models/User");
const WalletTransaction = require("../../models/WalletTransaction");
const { getAdminConfig } = require("../../utils/adminConfig");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Stripe = require("stripe");

// ─── Gateway router ──────────────────────────────────────────────────────────
// INR  → Razorpay
// All other currencies → Stripe Checkout (hosted page redirect)
// ─────────────────────────────────────────────────────────────────────────────

const initiateRecharge = async (req, res) => {
    const userId = req.user.userId;
    const { amount } = req.body;

    try {
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const currencyCode = (user.currencyCode || "INR").toUpperCase();
        const isINR = currencyCode === "INR";

        if (isINR) {
            // ── Razorpay flow (unchanged) ────────────────────────────────
            const coins = Number(amount);

            if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
                return res.status(500).json({ 
                    success: false, 
                    message: "Payment gateways are not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your backend .env file." 
                });
            }

            const instance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
            });

            const options = {
                amount: Math.round(amount * 100), // Paise
                currency: "INR",
                receipt: `rcpt_${Date.now()}`,
            };

            try {
                const order = await instance.orders.create(options);

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
                        gateway: "razorpay",
                        country: user.countryCode,
                        currency: currencyCode,
                        orderId: order.id,
                    },
                });

                return res.status(200).json({
                    success: true,
                    gateway: "razorpay",
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    keyId: process.env.RAZORPAY_KEY_ID,
                    transactionId: transaction._id,
                    message: "Razorpay order initiated",
                });
            } catch (razorError) {
                console.error("Razorpay Order Error:", razorError);
                return res.status(500).json({ success: false, message: "Payment initialization failed", detail: razorError.message });
            }

        } else {
            // ── Stripe Checkout flow (international) ────────────────────
            if (!process.env.STRIPE_SECRET_KEY) {
                return res.status(500).json({ 
                    success: false, 
                    message: "Payment gateways are not configured. Please add STRIPE_SECRET_KEY to your backend .env file." 
                });
            }
            const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
            const { getCachedRates } = require("../../utils/exchangeRate");
            
            let coins = Number(amount);
            const rates = (await getCachedRates()).rates;
            
            // Convert to INR base: amount / rates[currencyCode] * rates['INR']
            const targetRate = rates[currencyCode];
            const inrRate = rates['INR'];
            if (targetRate && inrRate) {
                coins = Math.round((amount / targetRate) * inrRate);
            }
            
            const frontendUrl = req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5173";

            // Create a pending transaction FIRST to get the ID for redirect URLs
            const transaction = await WalletTransaction.create({
                userId,
                type: "deposit",
                coins,
                amount,
                beforeBalance: user.rechargeCoins,
                afterBalance: user.rechargeCoins,
                status: "pending",
                referenceId: `stripe_pending_${Date.now()}`,
                idempotencyKey: `stripe_${userId}_${Date.now()}`,
                referenceType: "payment_gateway",
                meta: {
                    gateway: "stripe",
                    country: user.countryCode,
                    currency: currencyCode,
                },
            });

            // Stripe expects amount in smallest currency unit (cents, pence, etc.)
            // Most currencies use 2 decimal places (multiply by 100)
            // Zero-decimal currencies (JPY, KRW, etc.) should not be multiplied
            const ZERO_DECIMAL_CURRENCIES = ["BIF","CLP","DJF","GNF","JPY","KMF","KRW","MGA","PYG","RWF","UGX","VND","VUV","XAF","XOF","XPF"];
            const stripeAmount = ZERO_DECIMAL_CURRENCIES.includes(currencyCode)
                ? Math.round(amount)
                : Math.round(amount * 100);

            try {
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ["card"],
                    mode: "payment",
                    line_items: [
                        {
                            price_data: {
                                currency: currencyCode.toLowerCase(),
                                unit_amount: stripeAmount,
                                product_data: {
                                    name: "KnQ Reels — Wallet Recharge",
                                    description: `Add ${coins} coins to your wallet`,
                                },
                            },
                            quantity: 1,
                        },
                    ],
                    customer_email: user.email,
                    metadata: {
                        transactionId: transaction._id.toString(),
                        userId: userId.toString(),
                        coins: coins.toString(),
                    },
                    success_url: `${frontendUrl}/wallet?gateway=stripe&trx=${transaction._id}&session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${frontendUrl}/wallet?cancelled=true`,
                });

                // Store Stripe session ID in transaction for later verification
                transaction.referenceId = session.id;
                transaction.meta = { ...transaction.meta, sessionId: session.id };
                await transaction.save();

                return res.status(200).json({
                    success: true,
                    gateway: "stripe",
                    sessionId: session.id,
                    sessionUrl: session.url,
                    transactionId: transaction._id,
                    amount,
                    currency: currencyCode,
                    message: "Stripe checkout session created",
                });
            } catch (stripeError) {
                console.error("Stripe Session Error:", stripeError);
                // Clean up the pending transaction on failure
                await WalletTransaction.findByIdAndDelete(transaction._id);
                return res.status(500).json({ success: false, message: "Stripe initialization failed", detail: stripeError.message });
            }
        }

    } catch (error) {
        console.error("Critical Payment Initiation Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Verify Payment ───────────────────────────────────────────────────────────
// Called by frontend after payment completes (both gateways).
// Detects which gateway handled the transaction via meta.gateway.
// ─────────────────────────────────────────────────────────────────────────────

const verifyPayment = async (req, res) => {
    const {
        transactionId,
        // Razorpay fields
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        // Stripe fields
        session_id,
    } = req.body;

    try {
        const transaction = await WalletTransaction.findById(transactionId);
        if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });

        if (transaction.status === "success") {
            return res.status(200).json({ success: true, message: "Already processed" });
        }

        const gateway = transaction.meta?.gateway || "razorpay";

        if (gateway === "stripe") {
            // ── Stripe verification ──────────────────────────────────────
            const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
            const storedSessionId = transaction.meta?.sessionId || session_id;

            if (!storedSessionId) {
                return res.status(400).json({ success: false, message: "Missing Stripe session ID" });
            }

            let session;
            try {
                session = await stripe.checkout.sessions.retrieve(storedSessionId);
            } catch (err) {
                return res.status(400).json({ success: false, message: "Could not retrieve Stripe session" });
            }

            if (session.payment_status !== "paid") {
                transaction.status = "failed";
                await transaction.save();
                return res.status(400).json({ success: false, message: `Payment not completed (status: ${session.payment_status})` });
            }

            // ATOMIC UPDATE: Only proceed if status is still pending
            const updatedTransaction = await WalletTransaction.findOneAndUpdate(
                { _id: transactionId, status: "pending" },
                { $set: { status: "success" } },
                { new: true }
            ).exec();

            if (!updatedTransaction) {
                // If we couldn't update, it means it's already processed or changed status
                return res.status(200).json({ success: true, message: "Already processed" });
            }

            // Credit wallet
            const user = await User.findById(transaction.userId);
            if (!user) throw new Error("User not found");

            const before = user.rechargeCoins;
            user.rechargeCoins += transaction.coins;
            await user.save();

            updatedTransaction.beforeBalance = before;
            updatedTransaction.afterBalance = user.rechargeCoins;
            updatedTransaction.meta = { ...transaction.meta, stripePaymentIntent: session.payment_intent, verifiedBy: "frontend_redirect" };
            await updatedTransaction.save();

            return res.status(200).json({ success: true, message: "Stripe payment verified and wallet updated" });

        } else {
            // ── Razorpay verification (unchanged) ────────────────────────
            const generatedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(razorpay_order_id + "|" + razorpay_payment_id)
                .digest("hex");

            if (generatedSignature !== razorpay_signature) {
                transaction.status = "failed";
                await transaction.save();
                return res.status(400).json({ success: false, message: "Payment verification failed: Signature mismatch" });
            }

            // ATOMIC UPDATE: Only proceed if status is still pending
            const updatedTransaction = await WalletTransaction.findOneAndUpdate(
                { _id: transactionId, status: "pending" },
                { $set: { status: "success" } },
                { new: true }
            ).exec();

            if (!updatedTransaction) {
                return res.status(200).json({ success: true, message: "Already processed" });
            }

            const user = await User.findById(transaction.userId);
            if (!user) throw new Error("User associated with transaction not found");

            const before = user.rechargeCoins;
            user.rechargeCoins += transaction.coins;
            await user.save();

            updatedTransaction.beforeBalance = before;
            updatedTransaction.afterBalance = user.rechargeCoins;
            updatedTransaction.meta = { ...transaction.meta, paymentId: razorpay_payment_id, verifiedBy: "frontend_callback" };
            await updatedTransaction.save();

            return res.status(200).json({ success: true, message: "Payment verified and wallet updated" });
        }

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Stripe Webhook ───────────────────────────────────────────────────────────
// Stripe calls this server-side to confirm payment (most reliable method).
// Must use raw body — configured in paymentRoutes.js
// ─────────────────────────────────────────────────────────────────────────────

const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("Stripe Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        if (session.payment_status !== "paid") return res.status(200).json({ received: true });

        const transactionId = session.metadata?.transactionId;
        if (!transactionId) {
            console.warn("[Stripe Webhook] No transactionId in session metadata");
            return res.status(200).json({ received: true });
        }

        try {
            // ATOMIC UPDATE: Only proceed if status is still pending
            const transaction = await WalletTransaction.findOneAndUpdate(
                { _id: transactionId, status: "pending" },
                { $set: { status: "success" } },
                { new: true }
            ).exec();

            if (!transaction) {
                // If it's not pending, it's either success or failed already
                console.log(`[Stripe Webhook] Transaction ${transactionId} already processed.`);
                return res.status(200).json({ received: true });
            }

            const user = await User.findById(transaction.userId);
            if (!user) throw new Error("User not found for webhook transaction");

            const before = user.rechargeCoins;
            user.rechargeCoins += transaction.coins;
            await user.save();

            transaction.beforeBalance = before;
            transaction.afterBalance = user.rechargeCoins;
            transaction.meta = { ...transaction.meta, stripePaymentIntent: session.payment_intent, verifiedBy: "webhook" };
            await transaction.save();

            console.log(`[Stripe Webhook] Wallet credited: user=${transaction.userId}, coins=${transaction.coins}`);
        } catch (err) {
            console.error("[Stripe Webhook] Processing error:", err);
            return res.status(500).json({ error: "Webhook processing failed" });
        }
    }

    res.status(200).json({ received: true });
};

// ─── Legacy callback (kept as-is) ────────────────────────────────────────────

const handleCallback = async (req, res) => {
    res.status(200).json({ success: true });
};

module.exports = {
    initiateRecharge,
    verifyPayment,
    stripeWebhook,
    handleCallback,
};

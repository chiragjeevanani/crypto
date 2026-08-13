const Post = require("../../models/Post");
const PromotionSettings = require("../../models/PromotionSettings");
const { getAdminConfig } = require("../../utils/adminConfig");
const User = require("../../models/User");
const Stripe = require("stripe");
const WalletTransaction = require("../../models/WalletTransaction");
const crypto = require("crypto");

/**
 * Initiate payment for a business post.
 * POST /api/business/initiate-payment
 */
exports.initiatePayment = async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ success: false, message: "Post ID is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (!post.isBusiness) {
      return res.status(400).json({ success: false, message: "This is not a business post" });
    }

    if (post.paymentStatus === "paid") {
      return res.status(200).json({ 
        success: true, 
        message: "Post already paid/published",
        data: { postId: post._id, amount: 0, orderId: "already_paid" }
      });
    }

    const user = await User.findById(post.creator);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currencyCode = (user.currencyCode || "INR").toUpperCase();
    const isINR = currencyCode === "INR";

    const config = await getAdminConfig();
    let amount = isINR ? (config.businessPostPriceINR || 499) : 10; // Fallback defaults

    // If the post has promotion budget set, use that
    if (post.promotion?.isEnabled && post.promotion?.totalBudget > 0) {
      amount = post.promotion.totalBudget;
    }

    if (isINR) {
      // ── Razorpay flow ──────────────────────────────────────────
      const Razorpay = require("razorpay");
      let orderId = `sim_${Date.now()}_${post._id}`;

      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
          const rzp = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
          });
          const order = await rzp.orders.create({
            amount: Math.round(amount * 100), // paise
            currency: "INR",
            receipt: post._id.toString(),
            notes: {
              postId: post._id.toString(),
              type: "promotion"
            }
          });
          orderId = order.id;
        } catch (rzpErr) {
          console.error("Razorpay Order Creation Failed:", rzpErr);
        }
      }
      
      return res.status(200).json({
        success: true,
        data: {
          gateway: "razorpay",
          postId: post._id,
          amount,
          currency: "INR",
          orderId,
          keyId: process.env.RAZORPAY_KEY_ID,
          message: "Payment initiated via Razorpay"
        }
      });
    } else {
      // ── Stripe Checkout flow ────────────────────────────────────
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5174";

      const stripeAmount = Math.round(amount * 100); // cents

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
                  name: "SocialEarn Promotion",
                  description: `Promotion for Reel #${post._id.toString().slice(-6)}`,
                },
              },
              quantity: 1,
            },
          ],
          customer_email: user.email,
          metadata: {
            postId: post._id.toString(),
            type: "promotion",
          },
          success_url: `${frontendUrl}/create?status=success&postId=${post._id}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${frontendUrl}/create?status=cancelled&postId=${post._id}`,
        });

        return res.status(200).json({
          success: true,
          data: {
            gateway: "stripe",
            postId: post._id,
            amount,
            currency: currencyCode,
            sessionId: session.id,
            sessionUrl: session.url,
            message: "Stripe checkout session created"
          }
        });
      } catch (stripeError) {
        console.error("Stripe Session Error (Promotion):", stripeError);
        return res.status(500).json({ success: false, message: "Stripe initialization failed" });
      }
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify payment for a business post.
 * POST /api/business/verify-payment
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { postId, paymentId, orderId, signature, sessionId } = req.body;
    
    if (!postId) {
      return res.status(400).json({ success: false, message: "Post ID is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.paymentStatus === "paid") {
      return res.status(200).json({ success: true, message: "Post already paid", post });
    }

    // Stripe verification
    if (sessionId) {
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status !== "paid") {
          return res.status(400).json({ success: false, message: "Stripe payment not completed" });
        }
      } catch (err) {
        return res.status(400).json({ success: false, message: "Could not verify Stripe session" });
      }
    } 
    // Razorpay verification
    else if (paymentId) {
      if (process.env.RAZORPAY_KEY_SECRET && signature && orderId && !orderId.startsWith("sim_")) {
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(orderId + "|" + paymentId);
        const generatedSignature = hmac.digest("hex");
        if (generatedSignature !== signature) {
          return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }
      }
    } else {
      return res.status(400).json({ success: false, message: "Missing payment verification data" });
    }

    // Mark as paid but keep pending for admin review
    post.paymentStatus = "paid";
    post.isPublished = false; // Remains false until admin approval
    post.status = "pending";
    if (post.promotion) post.promotion.status = "paused"; // or "active" if you want it to start immediately after approval
    
    const WalletTransaction = require("../../models/WalletTransaction");
    const User = require("../../models/User");
    const user = await User.findById(post.creator);

    await WalletTransaction.create({
      userId: post.creator,
      type: "withdrawal", 
      amount: post.promotion?.totalBudget || 499,
      coins: 0,
      beforeBalance: (user?.rechargeCoins || 0),
      afterBalance: (user?.rechargeCoins || 0),
      referenceId: post._id.toString(),
      referenceType: "post",
      status: "success",
      meta: { reason: "Promotion Ad Budget Payment", orderId: orderId, paymentId: paymentId }
    });

    post.history.push({ action: "Payment verified, awaiting admin approval" });
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified and post published",
      post: post
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get current promotion settings for users.
 * GET /api/business/settings
 */
exports.getSettings = async (req, res) => {
  try {
    let settings = await PromotionSettings.findOne();
    if (!settings) {
      settings = await PromotionSettings.create({});
    }
    return res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Handle failed or cancelled payment for a business post.
 * POST /api/business/fail-payment
 */
exports.failPayment = async (req, res) => {
  try {
    const { postId, reason } = req.body;
    if (!postId) return res.status(400).json({ success: false, message: "Post ID is required" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    post.paymentStatus = "failed";
    post.history.push({ action: `Payment failed/cancelled. Reason: ${reason || "User cancelled"}` });
    await post.save();

    return res.status(200).json({ success: true, message: "Post marked as failed payment" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

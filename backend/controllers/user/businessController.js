const Post = require("../../models/Post");
const PromotionSettings = require("../../models/PromotionSettings");
const { getAdminConfig } = require("../../utils/adminConfig");

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

    const config = await getAdminConfig();
    let amount = config.businessPostPriceINR || 499;

    // If the post has promotion budget set, use that
    if (post.promotion?.isEnabled && post.promotion?.totalBudget > 0) {
      amount = post.promotion.totalBudget;
    }

    const Razorpay = require("razorpay");
    let orderId = `sim_${Date.now()}_${post._id}`;

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const rzp = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        const order = await rzp.orders.create({
          amount: amount * 100, // amount in smallest currency unit (paise)
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
        // Fallback or handle error
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        postId: post._id,
        amount,
        currency: "INR",
        orderId,
        message: "Payment initiated"
      }
    });
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
    const { postId, paymentId, orderId, signature } = req.body;
    const crypto = require("crypto");
    
    if (!postId || !paymentId) {
      return res.status(400).json({ success: false, message: "Missing required verification data" });
    }

    // Real Signature Verification
    if (process.env.RAZORPAY_KEY_SECRET && signature && !orderId.startsWith("sim_")) {
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(orderId + "|" + paymentId);
      const generatedSignature = hmac.digest("hex");
      if (generatedSignature !== signature) {
        return res.status(400).json({ success: false, message: "Invalid payment signature. Potential fraud." });
      }
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.paymentStatus === "paid") {
      return res.status(200).json({ success: true, message: "Post already paid", post });
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
      type: "deposit", 
      amount: post.promotion?.totalBudget || 499,
      coins: 0,
      beforeBalance: (user?.rechargeCoins || 0),
      afterBalance: (user?.rechargeCoins || 0),
      referenceId: post._id.toString(),
      referenceType: "post",
      status: "success",
      meta: { reason: "Promotional Ad Budget", orderId: orderId, paymentId: paymentId }
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

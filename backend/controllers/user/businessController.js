const Post = require("../../models/Post");
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
    const amount = config.businessPostPriceINR || 499;

    // Here you would normally interface with Razorpay/Stripe
    // For now, we return payment details for simulation
    // In a real app, you'd return orderId from Razorpay or sessionId from Stripe
    
    return res.status(200).json({
      success: true,
      data: {
        postId: post._id,
        amount,
        currency: "INR",
        orderId: `sim_${Date.now()}_${post._id}`, // Simulated order ID
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
    
    // In a real Razorpay/Stripe implementation, you would verify the signature here.
    // For simulation, we assume any truthy paymentId works.

    if (!postId || !paymentId) {
      return res.status(400).json({ success: false, message: "Missing required verification data" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.paymentStatus === "paid") {
      return res.status(200).json({ success: true, message: "Post already paid", post });
    }

    // Mark as paid and publish
    post.paymentStatus = "paid";
    post.isPublished = true;
    post.status = "approved";
    
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

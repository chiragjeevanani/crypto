const KycSubmission = require("../../models/KycSubmission");
const User = require("../../models/User");
const Notification = require("../../models/Notification");

/**
 * List all KYC submissions
 */
const listKycSubmissions = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const submissions = await KycSubmission.find(query)
      .populate("userId", "name email role referralCount isMonetized")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, submissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Approve or Reject KYC
 */
const reviewKyc = async (req, res) => {
  const { submissionId, status, rejectionReason } = req.body;
  const adminId = req.user.userId;

  try {
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status. Use 'verified' or 'rejected'." });
    }

    const submission = await KycSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: "KYC submission not found" });
    }

    submission.status = status;
    submission.rejectionReason = rejectionReason || "";
    submission.reviewedBy = adminId;
    submission.reviewedAt = new Date();
    await submission.save();

    // If verified, update the user profile too
    if (status === 'verified') {
      await User.findByIdAndUpdate(submission.userId, {
        $set: { 
          kycStatus: 'verified',
          isMonetized: true // Automatically monetize on KYC approval if needed
        }
      });
    } else {
      await User.findByIdAndUpdate(submission.userId, {
        $set: { kycStatus: 'rejected' }
      });
    }

    // Send Notification to user
    await Notification.create({
      recipientId: submission.userId,
      type: "system",
      title: status === 'verified' ? "KYC Approved! 🎉" : "KYC Rejected ❌",
      subtitle: status === 'verified' 
        ? "Your account is now verified. Monetization and withdrawals are unlocked." 
        : `Reason: ${rejectionReason || "Documentation did not meet our guidelines."}`,
      meta: { 
        status, 
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        reviewId: submission._id 
      }
    });

    return res.status(200).json({ 
      success: true, 
      message: `KYC submission ${status} successfully.`,
      submission 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listKycSubmissions,
  reviewKyc
};

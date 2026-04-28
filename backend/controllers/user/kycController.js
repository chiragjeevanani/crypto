const KycSubmission = require("../../models/KycSubmission");
const User = require("../../models/User");

/**
 * Submit KYC details for verification
 */
const submitKyc = async (req, res) => {
  const userId = req.user.userId;
  const { aadharNumber, panNumber, documents } = req.body;

  try {
    if (!aadharNumber || !panNumber) {
      return res.status(400).json({ success: false, message: "Aadhar and PAN numbers are required" });
    }

    if (!documents || !documents.aadharFrontUrl || !documents.aadharBackUrl || !documents.panCardUrl) {
      return res.status(400).json({ success: false, message: "All document images are required" });
    }

    // Upsert logic: If a pending or rejected submission exists, update it.
    let submission = await KycSubmission.findOne({ userId });
    
    if (submission && submission.status === 'verified') {
      return res.status(400).json({ success: false, message: "KYC is already verified" });
    }

    if (submission) {
      submission.aadharNumber = aadharNumber;
      submission.panNumber = panNumber;
      submission.documents = documents;
      submission.status = "pending";
      submission.rejectionReason = "";
      await submission.save();
    } else {
      submission = await KycSubmission.create({
        userId,
        aadharNumber,
        panNumber,
        documents,
        status: "pending"
      });
    }

    return res.status(201).json({ 
      success: true, 
      message: "KYC submitted successfully. Admin will review it soon.",
      submission 
    });
  } catch (error) {
    console.error("[KYC] Submission error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get current user's KYC status
 */
const getMyKycStatus = async (req, res) => {
  try {
    const submission = await KycSubmission.findOne({ userId: req.user.userId });
    return res.status(200).json({ success: true, submission });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitKyc,
  getMyKycStatus
};

const mongoose = require("mongoose");

const staffMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["staff", "team_leader"],
      default: "staff",
    },
    // Sidebar menu keys granted by admin, e.g. ["users", "reports", "kyc"]
    grantedMenus: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    // Reference to the admin who created this staff member
    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    // Password reset via email OTP
    resetPasswordOtp: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

staffMemberSchema.index({ role: 1 });
staffMemberSchema.index({ isActive: 1 });

module.exports = mongoose.model("StaffMember", staffMemberSchema);

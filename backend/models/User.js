const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["User", "SuperNode", "Admin", "super_admin", "Developer"],
      default: "User"
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    bio: {
      type: String,
      trim: true,
      default: ""
    },
    avatar: {
      type: String,
      trim: true,
      default: ""
    },
    handle: {
      type: String,
      trim: true,
      default: ""
    },
    countryCode: {
      type: String,
      trim: true,
      default: ""
    },
    countryName: {
      type: String,
      trim: true,
      default: ""
    },
    currencyCode: {
      type: String,
      trim: true,
      default: "INR"
    },
    currencySymbol: {
      type: String,
      trim: true,
      default: "₹"
    },
    // Social graph
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");

const groupChatSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  avatar: { type: String, default: "" }, // Optional group picture
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true }); 

module.exports = mongoose.model("GroupChat", groupChatSchema);

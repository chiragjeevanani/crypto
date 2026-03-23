const path = require("path");
const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const userPostRoutes = require("./routes/user/postRoutes");
const userFollowRoutes = require("./routes/user/followRoutes");
const userStoryRoutes = require("./routes/user/storyRoutes");
const userCampaignRoutes = require("./routes/user/campaignRoutes");
const userReelFeedRoutes = require("./routes/user/reelFeedRoutes");
const userSearchRoutes = require("./routes/user/searchRoutes");
const userWalletRoutes = require("./routes/user/walletRoutes");
const userSavedPostRoutes = require("./routes/user/savedPostRoutes");
const adminModerationRoutes = require("./routes/admin/moderationRoutes");
const adminUserRoutes = require("./routes/admin/userRoutes");
const adminGiftRoutes = require("./routes/admin/giftRoutes");
const adminCampaignRoutes = require("./routes/admin/campaignRoutes");
const adminConfigRoutes = require("./routes/admin/configRoutes");
const businessRoutes = require("./routes/user/businessRoutes");
const musicRoutes = require("./routes/musicRoutes");
const adminWithdrawalRoutes = require("./routes/admin/withdrawalRoutes");

const app = express();

// Temporarily allow all origins (wildcard CORS). Do NOT use this in production without tightening it.
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend is live" });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user/posts", userPostRoutes);
app.use("/api/user/follow", userFollowRoutes);
app.use("/api/user/stories", userStoryRoutes);
app.use("/api/user/campaigns", userCampaignRoutes);
app.use("/api/user/reels-feed", userReelFeedRoutes);
app.use("/api/user/search", userSearchRoutes);
app.use("/api/user/wallet", userWalletRoutes);
app.use("/api/wallet", userWalletRoutes);
app.use("/api/saved", userSavedPostRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/admin/music", musicRoutes);
app.use("/api/user/business", businessRoutes); // alias
app.use("/api/admin/content", adminModerationRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/gifts", adminGiftRoutes);
app.use("/api/admin/campaigns", adminCampaignRoutes);
app.use("/api/admin/config", adminConfigRoutes);
app.use("/api/admin/withdrawals", adminWithdrawalRoutes);
app.use("/api/admin/withdraw", adminWithdrawalRoutes);

// 404 — must be after all routes so unmatched requests get a clear JSON response
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method
  });
});

module.exports = app;

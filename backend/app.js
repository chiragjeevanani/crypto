const path = require("path");
const express = require("express");
const cors = require("cors");
const compression = require("compression");
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
const adminMediaRoutes = require("./routes/admin/mediaRoutes");
const userMessageRoutes = require("./routes/user/messageRoutes");
const userPaymentRoutes = require("./routes/user/paymentRoutes");
const adminTransactionRoutes = require("./routes/admin/transactionRoutes");
const adminPromotionRoutes = require("./routes/admin/promotionAdminRoutes");
const adminCategoryRoutes = require("./routes/admin/categoryRoutes");
const userNotificationRoutes = require("./routes/user/notificationRoutes");
const userVideoRoutes = require("./routes/user/videoRoutes");
const adminReportRoutes = require("./routes/admin/reportRoutes");
const adminNotificationRoutes = require("./routes/admin/notificationRoutes");
const adminDashboardRoutes = require("./routes/admin/dashboardRoutes");
const adminDealRoutes = require("./routes/admin/dealRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const locationRoutes = require("./routes/locationRoutes");
const nftRoutes = require("./routes/nftRoutes"); // Collectible (Web2) routes
const agoraRoutes = require("./routes/agoraRoutes"); // Agora Voice/Video endpoints
const { processEndedAuctions } = require("./controllers/auctionController");
const { processVaultSettlements } = require("./controllers/nftController");
const { processExpiredPromotions } = require("./controllers/user/postController");


const app = express();
app.set("etag", false);

app.use(compression());
app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend is live", version: "1.0.1-debug" });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/api/test-ping", (req, res) => res.json({ success: true, message: "pong" }));
app.use("/api/health", healthRoutes);
app.use("/api/config", require("./routes/publicConfigRoutes"));
app.use("/api/auth", authRoutes);
app.use("/api/user/posts", userPostRoutes);
app.use("/api/user/follow", userFollowRoutes);
app.use("/api/user/stories", userStoryRoutes);
app.use("/api/user/campaigns", userCampaignRoutes);
app.use("/api/user/reels-feed", userReelFeedRoutes);
app.use("/api/user/kyc", require("./routes/user/kycRoutes"));
app.use("/api/admin/kyc", require("./routes/admin/kycAdminRoutes"));
app.use("/api/user/search", userSearchRoutes);
app.use("/api/user/wallet", userWalletRoutes);
app.use("/api/wallet", userWalletRoutes);
app.use("/api/saved", userSavedPostRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/admin/music", musicRoutes);
app.use("/api/user/business", businessRoutes); // alias
app.use("/api/admin/content", adminModerationRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes); // Moved up for priority
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/gifts", adminGiftRoutes);
app.use("/api/admin/campaigns", adminCampaignRoutes);
app.use("/api/admin/config", adminConfigRoutes);
app.use("/api/admin/media", adminMediaRoutes);
app.use("/api/admin/withdrawals", adminWithdrawalRoutes);
app.use("/api/admin/promotion", adminPromotionRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/transactions", adminTransactionRoutes);
app.use("/api/admin/deals", adminDealRoutes);
app.use("/api/deals", adminDealRoutes);
app.use("/api/user/messages", userMessageRoutes);
app.use("/api/payment", userPaymentRoutes);
app.use("/api/notifications", userNotificationRoutes);
app.use("/api/video", userVideoRoutes);
app.use("/api/admin/reports", adminReportRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/fcm", require("./routes/user/fcm.routes"));
app.use("/api/auctions", auctionRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/nft", nftRoutes); // Collectible (Web2) endpoints
app.use("/api/agora", agoraRoutes); // Agora Token generation
// Route removed from here to be moved higher up

// Background jobs function - called after DB is connected
const startBackgroundJobs = () => {
    console.log('[Jobs] Starting background workers...');
    setInterval(processEndedAuctions, 60 * 1000); 
    setInterval(processVaultSettlements, 65 * 1000); 
    
    // Process expired promotions every 60 seconds
    setInterval(processExpiredPromotions, 60 * 1000);
    // Run once immediately on start
    processExpiredPromotions().catch(err => console.error('[Jobs] Initial promotion check failed:', err.message));
};

app.startBackgroundJobs = startBackgroundJobs;


// 404 handler
app.use((req, res, next) => {
    console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
        method: req.method
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("[Global Error Handled]", err);
    res.status(500).json({ 
        success: false, 
        message: err.message || "Internal Server Error", 
        error: process.env.NODE_ENV !== 'production' ? err.message : undefined 
    });
});

module.exports = app;
// Trigger restart for Category schema update

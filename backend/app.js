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
const adminModerationRoutes = require("./routes/admin/moderationRoutes");
const adminUserRoutes = require("./routes/admin/userRoutes");
const adminGiftRoutes = require("./routes/admin/giftRoutes");
const adminCampaignRoutes = require("./routes/admin/campaignRoutes");

const app = express();

// Temporarily allow all origins (wildcard CORS). Do NOT use this in production without tightening it.
app.use(cors());
app.use(express.json());

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
app.use("/api/admin/content", adminModerationRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/gifts", adminGiftRoutes);
app.use("/api/admin/campaigns", adminCampaignRoutes);

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

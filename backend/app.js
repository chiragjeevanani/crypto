const path = require("path");
const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const userPostRoutes = require("./routes/user/postRoutes");
const userFollowRoutes = require("./routes/user/followRoutes");
const adminModerationRoutes = require("./routes/admin/moderationRoutes");
const adminUserRoutes = require("./routes/admin/userRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (no Origin header) and any explicitly allowed origin
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    }
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend is live" });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user/posts", userPostRoutes);
app.use("/api/user/follow", userFollowRoutes);
app.use("/api/admin/content", adminModerationRoutes);
app.use("/api/admin/users", adminUserRoutes);

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

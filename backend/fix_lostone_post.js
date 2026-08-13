const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Post = require("./models/Post");
const User = require("./models/User");

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/crypto-app";
    console.log("Connecting to:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Database connected successfully.");

    // Find the user "lostone"
    const user = await User.findOne({ name: "lostone" });
    if (!user) {
      console.log("User lostone not found.");
      return;
    }
    console.log("Found user lostone with ID:", user._id);

    // Find posts by this user
    const posts = await Post.find({ creator: user._id });
    console.log(`Found ${posts.length} posts by lostone.`);

    let updatedCount = 0;
    for (const post of posts) {
      // Check if media.type is "image" but has a video URL or video pipeline fields populated
      const isVideoUrl = post.media?.url && (
        post.media.url.includes("/uploads/videos/") || 
        post.media.url.endsWith(".mp4") || 
        post.media.url.endsWith(".m3u8") ||
        post.media.hlsUrl || 
        post.media.assetDir || 
        post.media.processingStatus === "processing" || 
        post.media.processingStatus === "ready"
      );

      if (post.media?.type === "image" && isVideoUrl) {
        console.log(`Fixing post ID ${post._id} with url: ${post.media.url}`);
        post.media.type = "video";
        // Also ensure it is marked approved and published
        post.status = "approved";
        post.isPublished = true;
        await post.save();
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} posts.`);
  } catch (err) {
    console.error("Error running script:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
}

run();

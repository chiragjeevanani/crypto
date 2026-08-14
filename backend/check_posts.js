const mongoose = require("mongoose");
require("dotenv").config();

async function check() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const Post = require("./models/Post");

        const posts = await Post.find().sort({ createdAt: -1 }).limit(5);
        console.log(`Found ${posts.length} recent posts:`);
        posts.forEach(p => {
            console.log(`- Post _id: ${p._id} | Creator: ${p.creator} | Caption: "${p.caption}"`);
            console.log(`  Media type: ${p.media?.type} | Url: "${p.media?.url}" | ThumbnailUrl: "${p.media?.thumbnailUrl}"`);
            console.log(`  Processing status: ${p.media?.processingStatus} | CreatedAt: ${p.createdAt}`);
        });

        process.exit(0);
    } catch (err) {
        console.error("Error in check script:", err);
        process.exit(1);
    }
}

check();

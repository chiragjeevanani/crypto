const mongoose = require("mongoose");

// Tracks a video's background processing job independently of the Post
// document, since the multer middleware can't await ffmpeg (mobile upload
// timeouts) and the job may finish before or after Post.create() runs.
// createPost reads this by assetId either way; the job's completion handler
// best-effort updates any Post that already references the same assetDir.
const mediaAssetSchema = new mongoose.Schema(
  {
    assetId: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["processing", "ready", "failed"], default: "processing" },
    originalPath: { type: String, default: "" },
    assetDir: { type: String, default: "" },
    url: { type: String, default: "" },
    hlsUrl: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    qualities: { type: [String], default: [] },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MediaAsset", mediaAssetSchema);

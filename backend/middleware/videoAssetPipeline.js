const path = require("path");
const fs = require("fs");
const mediaOptimizer = require("../utils/mediaOptimizer");
const MediaAsset = require("../models/MediaAsset");
const Post = require("../models/Post");
const { processVideoAsset } = require("../services/videoPipeline");

/**
 * Kicks off the new rendition-ladder pipeline for a single video file
 * without blocking the HTTP response (mirrors mediaOptimizer's existing
 * fire-and-forget pattern for video). On success: marks the MediaAsset
 * ready, deletes the original upload (no longer needed once the ladder +
 * fallback exist), and best-effort syncs any Post already created for this
 * asset. On failure: marks the MediaAsset failed and logs — the original
 * is deliberately NOT deleted, since it's the only playable copy left.
 */
function runVideoJobInBackground(file) {
  const assetId = path.parse(file.filename).name;
  const sourcePath = file.path;

  MediaAsset.create({ assetId, status: "processing", originalPath: sourcePath }).catch((err) => {
    console.error(`[videoAssetPipeline] failed to create MediaAsset ${assetId}:`, err.message);
  });

  file.assetId = assetId;
  file.processingStatus = "processing";

  processVideoAsset({ assetId, sourcePath })
    .then(async (result) => {
      await MediaAsset.updateOne(
        { assetId },
        {
          status: "ready",
          assetDir: result.assetDir,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          qualities: result.qualities,
          width: result.width,
          height: result.height,
          duration: result.duration,
        }
      ).catch((err) => console.error(`[videoAssetPipeline] failed to mark ${assetId} ready:`, err.message));

      try {
        if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);
      } catch (err) {
        console.error(`[videoAssetPipeline] failed to remove original upload ${sourcePath}:`, err.message);
      }

      try {
        await Post.updateOne(
          { "media.assetDir": result.assetDir },
          {
            $set: {
              "media.processingStatus": "ready",
              "media.url": result.url,
              "media.thumbnailUrl": result.thumbnailUrl,
              "media.qualities": result.qualities,
              "media.width": result.width,
              "media.height": result.height,
              "media.duration": result.duration,
            },
          }
        );
      } catch (err) {
        console.error(`[videoAssetPipeline] failed to sync Post for ${assetId}:`, err.message);
      }

      console.log(`[videoAssetPipeline] ${assetId} ready: qualities=${result.qualities.join(",")}`);
    })
    .catch(async (err) => {
      console.error(`[videoAssetPipeline] ${assetId} failed:`, err.message);
      try {
        await MediaAsset.updateOne({ assetId }, { status: "failed", error: err.message });
      } catch (updateErr) {
        console.error(`[videoAssetPipeline] failed to record failure for ${assetId}:`, updateErr.message);
      }
    });
}

async function videoAssetPipeline(req, res, next) {
  try {
    const files = req.file
      ? [req.file]
      : req.files
      ? Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat()
      : [];

    for (const file of files) {
      if (!file || !file.path) continue;
      const mimetype = file.mimetype;

      if (/^image\//.test(mimetype)) {
        if (mimetype !== "image/gif") {
          const newPath = await mediaOptimizer.compressImageToWebP(file.path);
          const stats = fs.statSync(newPath);
          file.path = newPath;
          file.filename = path.basename(newPath);
          file.mimetype = "image/webp";
          file.size = stats.size;
        }
      } else if (/^video\//.test(mimetype)) {
        runVideoJobInBackground(file);
        file.mimetype = "video/mp4";
      } else if (/^audio\//.test(mimetype)) {
        const result = await mediaOptimizer.compressAudio(file.path);
        const stats = fs.statSync(file.path);
        file.size = stats.size;
        file.mimetype = result.mimetype;
      }
    }
    next();
  } catch (error) {
    console.error("[videoAssetPipeline Middleware Error]:", error);
    next();
  }
}

module.exports = videoAssetPipeline;

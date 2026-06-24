const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

// Configure ffmpeg static binary path
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

/**
 * Compresses and converts an image file to WebP format.
 */
async function compressImageToWebP(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const webpPath = filePath.replace(new RegExp(ext + "$", "i"), "") + ".webp";

  try {
    let pipeline = sharp(filePath);

    // Resize image to fit inside 1200x1200px (retains aspect ratio, won't enlarge small images)
    pipeline = pipeline.resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true
    });

    // Compress/Convert to WebP with balanced quality and effort configuration
    pipeline = pipeline.webp({ quality: 75, effort: 4 });

    await pipeline.toFile(webpPath);

    // Replace original file with compressed webp file
    if (filePath !== webpPath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return webpPath;
  } catch (error) {
    if (fs.existsSync(webpPath) && filePath !== webpPath) {
      fs.unlinkSync(webpPath);
    }
    throw error;
  }
}

/**
 * Compresses a video file in-place (converting to mp4/h264) using ffmpeg.
 */
function compressVideo(filePath) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(filePath).toLowerCase();
    
    // We target MP4 container with H.264 and AAC codec for maximum web/mobile compatibility
    const tempPath = filePath.replace(new RegExp(ext + "$", "i"), "") + "-temp.mp4";

    ffmpeg(filePath)
      .outputOptions([
        "-vcodec libx264",
        "-crf 28", // Good compression/quality trade-off for mobile delivery (23 is default, higher = smaller size)
        "-preset superfast",
        "-acodec aac",
        "-b:a 128k",
        "-vf scale=w=1280:h=720:force_original_aspect_ratio=decrease" // limit resolution to 720p max
      ])
      .output(tempPath)
      .on("end", () => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          // Rename temp MP4 file to original filename (we keep the MP4 encoding)
          fs.renameSync(tempPath, filePath);
          resolve({
            path: filePath,
            mimetype: "video/mp4"
          });
        } catch (err) {
          reject(err);
        }
      })
      .on("error", (err) => {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        reject(err);
      })
      .run();
  });
}

/**
 * Compresses an audio file in-place (converting to mp3) using ffmpeg to save data.
 */
function compressAudio(filePath) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(filePath).toLowerCase();
    
    // Output mp3 format
    const tempPath = filePath.replace(new RegExp(ext + "$", "i"), "") + "-temp.mp3";

    ffmpeg(filePath)
      .outputOptions([
        "-acodec libmp3lame",
        "-b:a 64k", // Highly optimized bitrate for light data consumption
        "-ac 1"    // Mono format to save extra bandwidth
      ])
      .output(tempPath)
      .on("end", () => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          fs.renameSync(tempPath, filePath);
          resolve({
            path: filePath,
            mimetype: "audio/mpeg"
          });
        } catch (err) {
          reject(err);
        }
      })
      .on("error", (err) => {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        reject(err);
      })
      .run();
  });
}

/**
 * Helper to process a single file object from multer.
 */
async function processFile(file) {
  if (!file || !file.path) return;

  const mimetype = file.mimetype;
  const originalSize = file.size;

  try {
    if (/^image\//.test(mimetype)) {
      // Don't compress/convert gifs to avoid breaking animation
      if (mimetype !== "image/gif") {
        const newPath = await compressImageToWebP(file.path);
        const stats = fs.statSync(newPath);
        file.path = newPath;
        file.filename = path.basename(newPath);
        file.mimetype = "image/webp";
        file.size = stats.size;
        console.log(`[MediaOptimizer] Converted image to WebP ${file.filename}: ${originalSize} -> ${file.size} bytes`);
      }
    } else if (/^video\//.test(mimetype)) {
      const result = await compressVideo(file.path);
      const stats = fs.statSync(file.path);
      file.size = stats.size;
      file.mimetype = result.mimetype; // Ensure it reports as video/mp4
      console.log(`[MediaOptimizer] Compressed video ${file.filename}: ${originalSize} -> ${file.size} bytes`);
    } else if (/^audio\//.test(mimetype)) {
      const result = await compressAudio(file.path);
      const stats = fs.statSync(file.path);
      file.size = stats.size;
      file.mimetype = result.mimetype; // Ensure it reports as audio/mpeg
      console.log(`[MediaOptimizer] Compressed audio ${file.filename}: ${originalSize} -> ${file.size} bytes`);
    }
  } catch (err) {
    console.error(`[MediaOptimizer] Failed to compress ${file.filename || file.path}:`, err.message);
    // Non-blocking: if compression fails, we just keep the original file
  }
}

/**
 * Express middleware to optimize media files uploaded by multer.
 */
async function mediaOptimizer(req, res, next) {
  try {
    if (req.file) {
      await processFile(req.file);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          await processFile(file);
        }
      } else if (typeof req.files === "object") {
        const fields = Object.keys(req.files);
        for (const field of fields) {
          for (const file of req.files[field]) {
            await processFile(file);
          }
        }
      }
    }
    next();
  } catch (error) {
    console.error("[MediaOptimizer Middleware Error]:", error);
    next(); // Continue even if optimization failed to avoid blocking uploads
  }
}

module.exports = mediaOptimizer;

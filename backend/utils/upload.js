const path = require("path");
const multer = require("multer");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB limit for video and images

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (file.mimetype === "audio/mpeg" && "mp3") || (file.mimetype === "audio/wav" && "wav") || path.extname(file.originalname) || ".bin";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  console.log(`[Multer Upload] fileFilter - originalname: "${file.originalname}", mimetype: "${file.mimetype}"`);
  const isAllowedMime = /^image\//.test(file.mimetype) || /^video\//.test(file.mimetype) || /^audio\//.test(file.mimetype);
  const isAllowedExt = /\.(jpe?g|png|gif|webp|mp4|webm|mov|ogg|mp3|wav)$/i.test(file.originalname);

  if (isAllowedMime || isAllowedExt) {
    cb(null, true);
  } else {
    cb(new Error(`Only image, video, and audio files are allowed (received mimetype: ${file.mimetype}, name: ${file.originalname})`), false);
  }
};

const mediaOptimizer = require("./mediaOptimizer");
const videoAssetPipeline = require("../middleware/videoAssetPipeline");

const multerInstance = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: MAX_FILE_SIZE,
    fieldSize: 50 * 1024 * 1024 // 50MB limit to allow base64 cover images and large JSON payloads
  }
});

// Builds a multer-method wrapper that runs `postProcess` (or nothing) after
// multer saves the file. Used to keep every existing route's behavior exactly
// as it was (postProcess = mediaOptimizer, the historical default) while
// letting specific routes opt into a different — or no — post-processing step.
const createUpload = (postProcess) => ({
  single: (fieldName) => postProcess ? [multerInstance.single(fieldName), postProcess] : multerInstance.single(fieldName),
  array: (fieldName, maxCount) => postProcess ? [multerInstance.array(fieldName, maxCount), postProcess] : multerInstance.array(fieldName, maxCount),
  fields: (fields) => postProcess ? [multerInstance.fields(fields), postProcess] : multerInstance.fields(fields),
  any: () => postProcess ? [multerInstance.any(), postProcess] : multerInstance.any(),
  none: () => multerInstance.none(),
});

// Default export — unchanged behavior, still wraps every upload with
// mediaOptimizer. Every existing route (posts, stories, campaigns, NFT
// proofs, auctions, messages, avatar, gift sounds, admin media, music)
// keeps using this and is unaffected by anything below.
const upload = createUpload(mediaOptimizer);

// No post-processing at all. Used by /api/video/process-video: that route's
// own ffmpeg pass (videoProcessor.js) needs to read the file it was just
// given, and mediaOptimizer running concurrently in the background used to
// race it — compressing/renaming the same file out from under the read,
// producing nondeterministic output and orphaned -temp files on failure.
const uploadRaw = createUpload(null);

// New source-aware rendition-ladder pipeline for video (image/audio still go
// through the same compressImageToWebP/compressAudio helpers mediaOptimizer
// uses). Only /api/user/posts uses this in this pass — every other route
// stays on the original `upload` above.
const uploadHls = createUpload(videoAssetPipeline);

module.exports = { upload, uploadRaw, uploadHls, createUpload, UPLOAD_DIR, MAX_FILE_SIZE };

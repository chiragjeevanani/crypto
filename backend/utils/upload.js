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
  const allowed = /^image\//.test(file.mimetype) || /^video\//.test(file.mimetype) || /^audio\//.test(file.mimetype);
  if (allowed) cb(null, true);
  else cb(new Error("Only image, video, and audio files are allowed"), false);
};

const mediaOptimizer = require("./mediaOptimizer");

const multerInstance = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

// Wrap multer methods so mediaOptimizer runs automatically after upload
const upload = {
  single: (fieldName) => [multerInstance.single(fieldName), mediaOptimizer],
  array: (fieldName, maxCount) => [multerInstance.array(fieldName, maxCount), mediaOptimizer],
  fields: (fields) => [multerInstance.fields(fields), mediaOptimizer],
  any: () => [multerInstance.any(), mediaOptimizer],
  none: () => multerInstance.none()
};

module.exports = { upload, UPLOAD_DIR };


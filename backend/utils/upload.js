const path = require("path");
const multer = require("multer");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80MB for video

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

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

module.exports = { upload, UPLOAD_DIR };

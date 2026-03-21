const express = require("express");
const router = express.Router();
const musicController = require("../controllers/musicController");
const { protect, authorize } = require("../middleware/authMiddleware");
const multer = require("multer");
const os = require("os");

const upload = multer({ dest: os.tmpdir() });

// Admin routes
router.post(
  "/upload", 
  protect, 
  authorize("Admin", "SuperNode", "super_admin", "Developer"), 
  upload.fields([
    { name: "audio", maxCount: 1 }, 
    { name: "thumbnail", maxCount: 1 }
  ]), 
  musicController.uploadMusic
);
router.get("/all", protect, authorize("Admin", "SuperNode", "super_admin", "Developer"), musicController.getAllMusicAdmin);
router.patch("/:id/toggle", protect, authorize("Admin", "SuperNode", "super_admin", "Developer"), musicController.toggleMusicStatus);
router.delete("/:id", protect, authorize("Admin", "SuperNode", "super_admin", "Developer"), musicController.deleteMusic);

// User routes
router.get("/", protect, musicController.getActiveMusic);

module.exports = router;

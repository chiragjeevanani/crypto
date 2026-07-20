const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../../middleware/authMiddleware");
const { upload } = require("../../utils/upload");
const { getBaseUrl } = require("../../utils/postHelpers");
const fs = require("fs");
const path = require("path");

router.post(
  "/upload",
  protect,
  authorize("Admin", "SuperNode", "super_admin", "Developer"),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const baseUrl = getBaseUrl(req);
      let fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

      res.status(200).json({
        success: true,
        url: fileUrl,
        type: req.file.mimetype.startsWith("video/") ? "video" : "image"
      });
    } catch (error) {
      console.error("[MediaUpload] Error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;

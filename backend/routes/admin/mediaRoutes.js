const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../../middleware/authMiddleware");
const { uploadRaw } = require("../../utils/upload");
const { getBaseUrl } = require("../../utils/postHelpers");

router.post(
  "/upload",
  protect,
  authorize("Admin", "SuperNode", "super_admin", "Developer"),
  uploadRaw.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const baseUrl = getBaseUrl(req);
      const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      const mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";

      res.status(200).json({
        success: true,
        url: fileUrl,
        type: mediaType
      });
    } catch (error) {
      console.error("[MediaUpload] Error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;

const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../../middleware/authMiddleware");
const { upload } = require("../../utils/upload");
const { cloudinary } = require("../../utils/cloudinary");
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
      const filePath = req.file.path;
      const useCloudinary = Boolean(
        cloudinary &&
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      );

      let fileUrl = "";
      if (useCloudinary) {
        const resourceType = req.file.mimetype.startsWith("video/") ? "video" : "image";
        const result = await cloudinary.uploader.upload(filePath, {
          resource_type: resourceType,
          folder: "crypto-app/campaigns"
        });
        fileUrl = result.secure_url;
        fs.unlink(filePath, () => {});
      } else {
        fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      }

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

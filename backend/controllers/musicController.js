const Music = require("../models/Music");
const { cloudinary } = require("../utils/cloudinary");
const fs = require("fs");

/**
 * Admin: Upload music
 */
exports.uploadMusic = async (req, res) => {
  try {
    const { title, artist } = req.body;
    if (!title || !artist || !req.files?.audio) {
      return res.status(400).json({ success: false, message: "Title, artist and audio file are required" });
    }

    const audioFile = req.files.audio[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    // Upload audio to Cloudinary
    const audioUpload = await cloudinary.uploader.upload(audioFile.path, {
      resource_type: "video", // audio files are uploaded as video resource type
      folder: "crypto-app/music/audio"
    });

    let thumbnailUrl = "";
    if (thumbnailFile) {
      const thumbUpload = await cloudinary.uploader.upload(thumbnailFile.path, {
        folder: "crypto-app/music/thumbnails"
      });
      thumbnailUrl = thumbUpload.secure_url;
    }

    const music = await Music.create({
      title,
      artist,
      audioUrl: audioUpload.secure_url,
      publicId: audioUpload.public_id,
      duration: audioUpload.duration || 0,
      thumbnail: thumbnailUrl,
      isActive: true
    });

    // cleanup
    fs.unlink(audioFile.path, () => {});
    if (thumbnailFile) fs.unlink(thumbnailFile.path, () => {});

    return res.status(201).json({ success: true, music });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Get all music (paginated)
 */
exports.getAllMusicAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const isActive = req.query.isActive;

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { artist: { $regex: search, $options: "i" } }
      ];
    }
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const music = await Music.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Music.countDocuments(query);

    return res.status(200).json({
      success: true,
      music,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Toggle isActive
 */
exports.toggleMusicStatus = async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);
    if (!music) return res.status(404).json({ success: false, message: "Music not found" });

    music.isActive = !music.isActive;
    await music.save();

    return res.status(200).json({ success: true, music });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Delete music
 */
exports.deleteMusic = async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);
    if (!music) return res.status(404).json({ success: false, message: "Music not found" });

    // delete from cloudinary
    if (music.publicId) {
      await cloudinary.uploader.destroy(music.publicId, { resource_type: "video" });
    }

    await music.deleteOne();

    return res.status(200).json({ success: true, message: "Music deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * User: Get active music
 */
exports.getActiveMusic = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";

    const query = { isActive: true };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { artist: { $regex: search, $options: "i" } }
      ];
    }

    const music = await Music.find(query, "title artist audioUrl duration thumbnail")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Music.countDocuments(query);

    return res.status(200).json({
      success: true,
      music,
      pagination: { total, page, limit }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

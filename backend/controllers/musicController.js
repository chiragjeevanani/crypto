const Music = require("../models/Music");
const fs = require("fs");
const spotifyService = require("../services/spotifyService");

/**
 * Admin: Upload music
 */
exports.uploadMusic = async (req, res) => {
  try {
    const { title, artist, duration } = req.body;
    if (!title || !artist || !req.files?.audio) {
      return res.status(400).json({ success: false, message: "Title, artist and audio file are required" });
    }

    const audioFile = req.files.audio[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    const path = require("path");
    const musicDir = path.join(__dirname, "../uploads/music");
    if (!fs.existsSync(musicDir)) {
      fs.mkdirSync(musicDir, { recursive: true });
    }

    const audioExt = path.extname(audioFile.originalname) || ".mp3";
    const audioFilename = `audio_${Date.now()}${audioExt}`;
    const audioPath = path.join(musicDir, audioFilename);
    
    fs.copyFileSync(audioFile.path, audioPath);
    fs.unlinkSync(audioFile.path);

    const audioUrl = `/uploads/music/${audioFilename}`;

    let thumbnailUrl = "";
    if (thumbnailFile) {
      const thumbExt = path.extname(thumbnailFile.originalname) || ".jpg";
      const thumbFilename = `thumb_${Date.now()}${thumbExt}`;
      const thumbPath = path.join(musicDir, thumbFilename);
      
      fs.copyFileSync(thumbnailFile.path, thumbPath);
      fs.unlinkSync(thumbnailFile.path);
      
      thumbnailUrl = `/uploads/music/${thumbFilename}`;
    }

    const music = await Music.create({
      title,
      artist,
      audioUrl: audioUrl,
      publicId: audioFilename,
      duration: duration ? parseFloat(duration) : 0,
      thumbnail: thumbnailUrl,
      isActive: true
    });

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

    const path = require("path");
    const fs = require("fs");

    if (music.audioUrl && music.audioUrl.startsWith('/uploads')) {
      const audioPath = path.join(__dirname, '..', music.audioUrl);
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
    
    if (music.thumbnail && music.thumbnail.startsWith('/uploads')) {
      const thumbPath = path.join(__dirname, '..', music.thumbnail);
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
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

/**
 * User: Search music via Spotify API
 */
exports.searchMusic = async (req, res) => {
  try {
    const query = req.query.q || "";
    const results = await spotifyService.searchSpotifyMusic(query);
    return res.status(200).json({
      success: true,
      music: results
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


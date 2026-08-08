const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static").path;

// Single shared place that wires fluent-ffmpeg to the bundled binaries. Both
// mediaOptimizer.js and videoProcessor.js (and the new video pipeline) require
// this module so ffprobe is always configured before anything tries to probe.
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (ffprobePath) {
  ffmpeg.setFfprobePath(ffprobePath);
}

module.exports = { ffmpeg, ffmpegPath, ffprobePath };

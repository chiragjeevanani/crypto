const { ffmpeg } = require("../utils/ffmpegSetup");

/**
 * Reads rotation off either the legacy `rotate` tag or the newer
 * Display Matrix side-data block ffprobe emits, normalized to 0/90/180/270.
 */
function readRotation(videoStream) {
  const tagRotate = Number.parseInt(videoStream?.tags?.rotate, 10);
  if (Number.isFinite(tagRotate) && tagRotate !== 0) {
    return ((tagRotate % 360) + 360) % 360;
  }

  const displayMatrix = (videoStream?.side_data_list || []).find(
    (sd) => sd.side_data_type === "Display Matrix" && typeof sd.rotation === "number"
  );
  if (displayMatrix) {
    return ((Math.round(-displayMatrix.rotation) % 360) + 360) % 360;
  }

  return 0;
}

function parseFrameRate(rate) {
  if (!rate || typeof rate !== "string") return 0;
  const [num, den] = rate.split("/").map(Number);
  if (!num || !den) return 0;
  return num / den;
}

/**
 * Probes a video file for the dimensions/duration/rotation/audio-presence
 * needed to pick a source-aware rendition ladder and encode correctly.
 * Never throws for a readable file with no video/audio stream — callers
 * decide what to do with a probe that comes back incomplete.
 */
function probeVideo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);

      const streams = data?.streams || [];
      const videoStream = streams.find((s) => s.codec_type === "video");
      const hasAudio = streams.some((s) => s.codec_type === "audio");

      if (!videoStream) {
        return resolve({
          hasVideo: false, hasAudio, width: 0, height: 0,
          displayWidth: 0, displayHeight: 0, rotation: 0, fps: 0,
          duration: Number(data?.format?.duration) || 0,
        });
      }

      const rotation = readRotation(videoStream);
      const rawWidth = Number(videoStream.width) || 0;
      const rawHeight = Number(videoStream.height) || 0;
      // Display dimensions are what the video actually looks like once rotation
      // metadata is applied — this is what the rendition ladder must be based on,
      // not the raw encoded pixel grid (a 1920x1080 clip tagged rotate=90 displays
      // as 1080x1920 vertical).
      const swapped = rotation === 90 || rotation === 270;

      resolve({
        hasVideo: true,
        hasAudio,
        width: rawWidth,
        height: rawHeight,
        displayWidth: swapped ? rawHeight : rawWidth,
        displayHeight: swapped ? rawWidth : rawHeight,
        rotation,
        fps: parseFrameRate(videoStream.avg_frame_rate) || parseFrameRate(videoStream.r_frame_rate),
        duration: Number(videoStream.duration) || Number(data?.format?.duration) || 0,
      });
    });
  });
}

module.exports = { probeVideo, readRotation, parseFrameRate };

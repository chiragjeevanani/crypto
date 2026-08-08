// Pure rung-selection and dimension math — no ffmpeg, no filesystem, fully
// unit-testable. Rungs are chosen off the video's SHORT side (post-rotation
// "display" dimensions) so a vertical 1080x1920 source ladders by its 1080
// width, not its 1920 height — this is what keeps vertical video vertical
// and prevents ever forcing a 16:9 shape onto it.

const RUNGS = [360, 480, 720, 1080];

const RUNG_PROFILES = {
  360: { crf: 26, maxrate: 800, bufsize: 1600, profile: "main", level: "3.1", audioBitrate: 96 },
  480: { crf: 25, maxrate: 1400, bufsize: 2800, profile: "main", level: "3.1", audioBitrate: 128 },
  720: { crf: 23, maxrate: 2800, bufsize: 5600, profile: "high", level: "4.0", audioBitrate: 128 },
  1080: { crf: 22, maxrate: 5000, bufsize: 10000, profile: "high", level: "4.1", audioBitrate: 128 },
};

/**
 * Resolves the encode profile for a rung, allowing env overrides
 * (VIDEO_CRF_360/480/720/1080, VIDEO_PRESET) without a code change.
 */
function getProfile(rung) {
  const base = RUNG_PROFILES[rung] || RUNG_PROFILES[360];
  const envCrf = Number(process.env[`VIDEO_CRF_${rung}`]);
  return {
    ...base,
    crf: Number.isFinite(envCrf) && envCrf > 0 ? envCrf : base.crf,
    preset: process.env.VIDEO_PRESET || "veryfast",
  };
}

/**
 * Source-aware rung selection: only rungs <= the source's short side are
 * generated (never upscale). A source smaller than the smallest rung (360)
 * gets exactly one rung at its own native short side instead of being
 * padded/upscaled up to 360.
 */
function selectRungs(shortSide) {
  const applicable = RUNGS.filter((r) => r <= shortSide);
  if (applicable.length === 0) {
    return [{ rung: "source", target: Math.max(2, Math.round(shortSide)) }];
  }
  return applicable.map((r) => ({ rung: r, target: r }));
}

/**
 * Scales both dimensions by the same factor so the short side lands on
 * `targetShortSide`, preserving aspect ratio and orientation exactly.
 * Rounds to even numbers (required for yuv420p encoding).
 */
function computeDimensions(displayWidth, displayHeight, targetShortSide) {
  const shortSide = Math.min(displayWidth, displayHeight);
  const scale = shortSide > 0 ? targetShortSide / shortSide : 1;
  const roundEven = (n) => Math.max(2, Math.round(n / 2) * 2);
  return {
    width: roundEven(displayWidth * scale),
    height: roundEven(displayHeight * scale),
  };
}

module.exports = { RUNGS, RUNG_PROFILES, getProfile, selectRungs, computeDimensions };

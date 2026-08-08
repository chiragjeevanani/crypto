const fs = require("fs");
const path = require("path");
const { ffmpeg } = require("../utils/ffmpegSetup");
const { probeVideo } = require("./videoProbe");
const { selectRungs, computeDimensions, getProfile } = require("./videoLadder");
const { videoJobQueue } = require("../utils/jobQueue");

// Computed directly (not imported from utils/upload.js) to avoid a circular
// require: upload.js -> middleware/videoAssetPipeline.js -> this file.
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const VIDEOS_DIR = path.join(UPLOAD_DIR, "videos");
const TMP_DIR = path.join(UPLOAD_DIR, ".tmp");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rmDirSafe(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (err) {
    console.error(`[videoPipeline] failed to clean up ${dir}:`, err.message);
  }
}

/**
 * Runs a single ffmpeg command through the shared concurrency-limited queue.
 * `buildCommand` is called only once the job is actually dequeued (not at
 * enqueue time) so a queued-but-not-yet-running job doesn't hold an ffmpeg
 * process handle. If the queue's timeout fires, the in-flight process is
 * force-killed via `onTimeout` rather than left running unbounded.
 */
function runFfmpegJob(buildCommand, label) {
  let activeCommand = null;
  return videoJobQueue.enqueue(
    () =>
      new Promise((resolve, reject) => {
        activeCommand = buildCommand();
        activeCommand.on("error", (err) => reject(err));
        activeCommand.on("end", () => resolve());
        activeCommand.run();
      }),
    {
      label,
      onTimeout: () => {
        try {
          activeCommand?.kill("SIGKILL");
        } catch (err) {
          console.error(`[videoPipeline] failed to kill timed-out job "${label}":`, err.message);
        }
      },
    }
  );
}

function buildRungCommand(sourcePath, outputPath, dims, profile, fps, hasAudio) {
  const keyint = Math.max(2, Math.round(2 * (fps || 30)));
  let command = ffmpeg(sourcePath)
    .videoCodec("libx264")
    .outputOptions([
      "-vf", `scale=${dims.width}:${dims.height}`,
      "-pix_fmt", "yuv420p",
      "-preset", profile.preset,
      "-crf", String(profile.crf),
      "-maxrate", `${profile.maxrate}k`,
      "-bufsize", `${profile.bufsize}k`,
      "-profile:v", profile.profile,
      "-level", profile.level,
      "-x264-params", `keyint=${keyint}:min-keyint=${keyint}:scenecut=0`,
      "-force_key_frames", "expr:gte(t,n_forced*2)",
      "-movflags", "+faststart",
    ]);

  if (hasAudio) {
    command = command
      .audioCodec("aac")
      .audioFrequency(44100)
      .audioChannels(2)
      .outputOptions(["-b:a", `${profile.audioBitrate}k`]);
  } else {
    command = command.noAudio();
  }

  return command.output(outputPath);
}

function buildPosterCommand(sourcePath, outputPath, seekSeconds) {
  return ffmpeg(sourcePath)
    .outputOptions(["-ss", String(seekSeconds), "-frames:v", "1", "-q:v", "3"])
    .output(outputPath);
}

/**
 * Encodes a source video into a source-aware rendition ladder (MP4 only —
 * HLS packaging is a later phase), a poster image, and a fallback MP4
 * (currently just a copy of the highest rung; phase 6 replaces this with a
 * stream-copy remux of the HLS output). Everything is built in a temp
 * directory and atomically renamed into place on success, so a URL is never
 * reachable mid-processing. Throws on failure and cleans up its own temp
 * directory — it does NOT touch the original uploaded file either way;
 * that decision belongs to the caller.
 */
async function processVideoAsset({ assetId, sourcePath }) {
  const tmpDir = path.join(TMP_DIR, assetId);
  const finalDir = path.join(VIDEOS_DIR, assetId);
  const startedAt = Date.now();

  ensureDir(tmpDir);

  try {
    const probe = await probeVideo(sourcePath);
    if (!probe.hasVideo) {
      throw new Error("No video stream found in uploaded file");
    }

    const shortSide = Math.min(probe.displayWidth, probe.displayHeight);
    const rungPlan = selectRungs(shortSide);
    const outputs = [];

    for (const { rung, target } of rungPlan) {
      const dims = computeDimensions(probe.displayWidth, probe.displayHeight, target);
      const rungLabel = typeof rung === "number" ? String(rung) : "source";
      const profile = getProfile(typeof rung === "number" ? rung : 360);
      const outputFile = `v${rungLabel}.mp4`;
      const outputPath = path.join(tmpDir, outputFile);

      const rungStarted = Date.now();
      await runFfmpegJob(
        () => buildRungCommand(sourcePath, outputPath, dims, profile, probe.fps, probe.hasAudio),
        `encode-${assetId}-${rungLabel}`
      );

      outputs.push({
        rung: rungLabel,
        width: dims.width,
        height: dims.height,
        file: outputFile,
        bytes: fs.statSync(outputPath).size,
        encodeMs: Date.now() - rungStarted,
      });
    }

    const highest = outputs[outputs.length - 1];
    const posterSeek = probe.duration > 1 ? 1 : 0;
    const posterPath = path.join(tmpDir, "poster.jpg");
    await runFfmpegJob(
      () => buildPosterCommand(path.join(tmpDir, highest.file), posterPath, posterSeek),
      `poster-${assetId}`
    );

    const fallbackPath = path.join(tmpDir, "fallback.mp4");
    fs.copyFileSync(path.join(tmpDir, highest.file), fallbackPath);

    const meta = {
      assetId,
      processedAt: new Date().toISOString(),
      totalMs: Date.now() - startedAt,
      source: {
        width: probe.width,
        height: probe.height,
        displayWidth: probe.displayWidth,
        displayHeight: probe.displayHeight,
        rotation: probe.rotation,
        duration: probe.duration,
        fps: probe.fps,
        hasAudio: probe.hasAudio,
      },
      outputs,
    };
    fs.writeFileSync(path.join(tmpDir, "meta.json"), JSON.stringify(meta, null, 2));

    ensureDir(VIDEOS_DIR);
    fs.renameSync(tmpDir, finalDir); // atomic — nothing is reachable via a URL until this line

    return {
      assetDir: `/uploads/videos/${assetId}`,
      url: `/uploads/videos/${assetId}/fallback.mp4`,
      thumbnailUrl: `/uploads/videos/${assetId}/poster.jpg`,
      qualities: outputs.map((o) => o.rung),
      width: probe.displayWidth,
      height: probe.displayHeight,
      duration: probe.duration,
      meta,
    };
  } catch (err) {
    rmDirSafe(tmpDir);
    throw err;
  }
}

module.exports = { processVideoAsset, VIDEOS_DIR, TMP_DIR };

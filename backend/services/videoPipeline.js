const fs = require("fs");
const path = require("path");
const { ffmpeg } = require("../utils/ffmpegSetup");
const { probeVideo } = require("./videoProbe");
const { selectRungs, computeDimensions, getProfile } = require("./videoLadder");
const { buildMasterPlaylist } = require("./hlsPlaylist");
const { videoJobQueue } = require("../utils/jobQueue");

const HLS_SEGMENT_SECONDS = Math.max(1, Number(process.env.HLS_SEGMENT_SECONDS) || 2);

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

// ffmpeg's fmp4 HLS muxer writes -hls_segment_filename references into the
// playlist as bare basenames automatically (seg-00000.m4s, ...), but writes
// -hls_fmp4_init_filename verbatim into the #EXT-X-MAP URI — if that flag is
// given an absolute path (needed so the actual init.mp4 file lands in the
// right directory), the ABSOLUTE PATH ends up embedded in the playlist text,
// which no HLS client can resolve. Fix up just that one line after encoding.
function fixInitSegmentUri(playlistPath, initAbsolutePath) {
  const content = fs.readFileSync(playlistPath, "utf8");
  const fixed = content.split(initAbsolutePath).join("init.mp4");
  if (fixed !== content) fs.writeFileSync(playlistPath, fixed);
}

function dirSizeBytes(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSizeBytes(entryPath) : fs.statSync(entryPath).size;
  }
  return total;
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

/**
 * Encodes one rung directly to HLS (fMP4 segments + its own variant
 * playlist) rather than a plain MP4. `-x264-params keyint=...:scenecut=0`
 * plus a matching `-force_key_frames` expression forces a keyframe exactly
 * every HLS_SEGMENT_SECONDS regardless of scene content — this is what keeps
 * segment boundaries aligned across every rung, which is what makes
 * mid-playback quality switching seamless instead of glitchy.
 */
function buildHlsRungCommand(sourcePath, rungDir, dims, profile, fps, hasAudio) {
  const keyint = Math.max(2, Math.round(HLS_SEGMENT_SECONDS * (fps || 30)));
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
      "-force_key_frames", `expr:gte(t,n_forced*${HLS_SEGMENT_SECONDS})`,
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

  command = command.outputOptions([
    "-f", "hls",
    "-hls_time", String(HLS_SEGMENT_SECONDS),
    "-hls_playlist_type", "vod",
    "-hls_segment_type", "fmp4",
    "-hls_fmp4_init_filename", path.join(rungDir, "init.mp4"),
    "-hls_segment_filename", path.join(rungDir, "seg-%05d.m4s"),
    "-hls_list_size", "0",
  ]);

  return command.output(path.join(rungDir, "playlist.m3u8"));
}

// Poster comes from the ORIGINAL source (still available at this point —
// the caller only deletes it after processVideoAsset returns successfully),
// scaled to the highest rung's dimensions. Reading from the source avoids any
// dependency on the HLS demuxer and gives the best available frame quality.
function buildPosterCommand(sourcePath, outputPath, seekSeconds, dims) {
  return ffmpeg(sourcePath)
    .outputOptions(["-ss", String(seekSeconds), "-frames:v", "1", "-vf", `scale=${dims.width}:${dims.height}`, "-q:v", "3"])
    .output(outputPath);
}

// Stream-copy remux of the highest rung's HLS output into a single plain
// MP4 — zero extra encode cost, zero extra generational quality loss. This
// is the file legacy (non-HLS-aware) callers and media.url ultimately point
// at. Needs an explicit protocol/extension whitelist because ffmpeg locks
// those down by default for the concat/hls demuxer reading local files.
function buildFallbackRemuxCommand(playlistPath, outputPath) {
  return ffmpeg(playlistPath)
    .inputOptions(["-protocol_whitelist", "file,crypto,data", "-allowed_extensions", "ALL"])
    .outputOptions(["-c", "copy", "-movflags", "+faststart"])
    .output(outputPath);
}

/**
 * Encodes a source video into a source-aware HLS rendition ladder (each rung
 * as fMP4 segments + its own variant playlist), a hand-written master
 * playlist, a poster image, and a fallback MP4 (a stream-copy remux of the
 * highest rung's HLS output — zero extra encode cost). Everything is built
 * in a temp directory and atomically renamed into place on success, so a URL
 * is never reachable mid-processing. Throws on failure and cleans up its own
 * temp directory — it does NOT touch the original uploaded file either way;
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
      const rungDir = path.join(tmpDir, `v${rungLabel}`);
      ensureDir(rungDir);

      const rungStarted = Date.now();
      await runFfmpegJob(
        () => buildHlsRungCommand(sourcePath, rungDir, dims, profile, probe.fps, probe.hasAudio),
        `encode-${assetId}-${rungLabel}`
      );
      fixInitSegmentUri(path.join(rungDir, "playlist.m3u8"), path.join(rungDir, "init.mp4"));

      outputs.push({
        rung: rungLabel,
        width: dims.width,
        height: dims.height,
        dir: `v${rungLabel}`,
        playlist: `v${rungLabel}/playlist.m3u8`,
        bytes: dirSizeBytes(rungDir),
        encodeMs: Date.now() - rungStarted,
        profile,
      });
    }

    const highest = outputs[outputs.length - 1];
    const posterSeek = probe.duration > 1 ? 1 : 0;
    const posterPath = path.join(tmpDir, "poster.jpg");
    await runFfmpegJob(
      () => buildPosterCommand(sourcePath, posterPath, posterSeek, { width: highest.width, height: highest.height }),
      `poster-${assetId}`
    );

    const masterPlaylist = buildMasterPlaylist(outputs);
    fs.writeFileSync(path.join(tmpDir, "master.m3u8"), masterPlaylist);

    const fallbackPath = path.join(tmpDir, "fallback.mp4");
    await runFfmpegJob(
      () => buildFallbackRemuxCommand(path.join(tmpDir, highest.playlist), fallbackPath),
      `fallback-remux-${assetId}`
    );

    const meta = {
      assetId,
      processedAt: new Date().toISOString(),
      totalMs: Date.now() - startedAt,
      segmentSeconds: HLS_SEGMENT_SECONDS,
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
      outputs: outputs.map(({ profile, ...rest }) => rest), // drop the profile object, keep it human-readable
      fallbackBytes: fs.statSync(fallbackPath).size,
    };
    fs.writeFileSync(path.join(tmpDir, "meta.json"), JSON.stringify(meta, null, 2));

    ensureDir(VIDEOS_DIR);
    fs.renameSync(tmpDir, finalDir); // atomic — nothing is reachable via a URL until this line

    return {
      assetDir: `/uploads/videos/${assetId}`,
      url: `/uploads/videos/${assetId}/fallback.mp4`,
      hlsUrl: `/uploads/videos/${assetId}/master.m3u8`,
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

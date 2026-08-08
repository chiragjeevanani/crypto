// Hand-writes the HLS master playlist as plain text. Deliberately not using
// ffmpeg's own -var_stream_map/-master_pl_name (which requires feeding all
// renditions through a single multi-output command) — this pipeline runs one
// ffmpeg process per rung instead (same architecture as the phase-5 MP4
// pass, already tested), so the master playlist is just a small, fully
// self-contained text-building step with no ffmpeg involvement or risk.

const CODEC_STRING = "avc1.640028,mp4a.40.2"; // H.264 High + AAC-LC, safe umbrella value

function estimateBandwidthBps(profile) {
  // HLS BANDWIDTH must be an upper bound in bits/sec; maxrate is already a
  // hard ceiling (video), audioBitrate likewise (audio) — sum with a small
  // margin for container/segment overhead.
  return Math.round((profile.maxrate + profile.audioBitrate) * 1000 * 1.05);
}

/**
 * @param {Array<{rung:string, width:number, height:number, profile:object}>} renditions
 *   Ordered low -> high; each rung's own playlist is expected at `v<rung>/playlist.m3u8`
 *   relative to wherever master.m3u8 itself is served from.
 */
function buildMasterPlaylist(renditions) {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:7"];
  for (const r of renditions) {
    const bandwidth = estimateBandwidthBps(r.profile);
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${r.width}x${r.height},CODECS="${CODEC_STRING}"`
    );
    lines.push(`v${r.rung}/playlist.m3u8`);
  }
  return lines.join("\n") + "\n";
}

module.exports = { buildMasterPlaylist, estimateBandwidthBps };

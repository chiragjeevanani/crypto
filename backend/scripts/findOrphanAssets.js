#!/usr/bin/env node
/**
 * Finds video asset directories under backend/uploads/videos/ that are no
 * longer referenced by any Post or CampaignSubmission.
 *
 * READ-ONLY BY DEFAULT — prints a report and touches nothing. Only deletes
 * when run with BOTH --delete AND --confirm. Never run this automatically
 * (no cron, no npm postinstall, nothing) — it's an operator tool.
 *
 * Usage:
 *   node scripts/findOrphanAssets.js                 # report only
 *   node scripts/findOrphanAssets.js --delete --confirm   # actually delete
 */
require("dotenv").config();
const dns = require("dns");
const dnsServers = (process.env.DNS_SERVERS || "1.1.1.1,8.8.8.8")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (dnsServers.length > 0) dns.setServers(dnsServers);

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../utils/db");
const Post = require("../models/Post");
const CampaignSubmission = require("../models/CampaignSubmission");
const { VIDEOS_DIR } = require("../services/videoPipeline");

// Never touch anything younger than this — a job that's still mid-encode,
// or a Post whose createPost() write just hasn't landed yet, must not race
// this scan. deletePostVideoAssetsSafely (postController.js) handles the
// synchronous, per-post safe-delete path; this script is only for sweeping
// up genuinely stale orphans (e.g. an upload whose Post.create() failed
// after the asset had already finished processing).
const MIN_AGE_MS = 24 * 60 * 60 * 1000;

function dirSizeBytes(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSizeBytes(entryPath) : fs.statSync(entryPath).size;
  }
  return total;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldDelete = args.includes("--delete") && args.includes("--confirm");

  if (!fs.existsSync(VIDEOS_DIR)) {
    console.log(`No videos directory at ${VIDEOS_DIR} — nothing to check.`);
    return;
  }

  await connectDB();

  const referencedAssetDirs = new Set(
    (await Post.find({ "media.assetDir": { $exists: true, $ne: "" } }).select("media.assetDir").lean())
      .map((p) => p.media?.assetDir)
      .filter(Boolean)
  );

  // CampaignSubmission stores an absolute URL, not an assetDir — cross-check
  // by substring match on the asset id instead.
  const campaignUrls = (await CampaignSubmission.find({}).select("reel.url").lean())
    .map((s) => s.reel?.url)
    .filter(Boolean);

  const entries = fs.readdirSync(VIDEOS_DIR, { withFileTypes: true }).filter((e) => e.isDirectory());
  const now = Date.now();
  const report = { total: entries.length, referenced: 0, referencedByCampaign: 0, tooYoung: 0, orphaned: [] };

  for (const entry of entries) {
    const assetId = entry.name;
    const assetDir = `/uploads/videos/${assetId}`;
    const fullPath = path.join(VIDEOS_DIR, assetId);
    const stat = fs.statSync(fullPath);

    if (now - stat.mtimeMs < MIN_AGE_MS) {
      report.tooYoung += 1;
      continue;
    }
    if (referencedAssetDirs.has(assetDir)) {
      report.referenced += 1;
      continue;
    }
    if (campaignUrls.some((url) => url.includes(assetId))) {
      report.referencedByCampaign += 1;
      continue;
    }

    report.orphaned.push({ assetId, sizeBytes: dirSizeBytes(fullPath), mtime: stat.mtime });
  }

  console.log(`\nScanned ${report.total} asset director${report.total === 1 ? "y" : "ies"} under ${VIDEOS_DIR}`);
  console.log(`  referenced by a Post: ${report.referenced}`);
  console.log(`  referenced by a CampaignSubmission: ${report.referencedByCampaign}`);
  console.log(`  younger than 24h (skipped — could be in-flight): ${report.tooYoung}`);
  console.log(`  ORPHANED (no reference found anywhere): ${report.orphaned.length}`);

  if (report.orphaned.length) {
    const totalBytes = report.orphaned.reduce((sum, o) => sum + o.sizeBytes, 0);
    console.log(`\nOrphaned (${(totalBytes / 1024 / 1024).toFixed(2)} MB total):`);
    for (const o of report.orphaned) {
      console.log(`  ${o.assetId}\t${(o.sizeBytes / 1024 / 1024).toFixed(2)} MB\tlast modified ${o.mtime.toISOString()}`);
    }
  }

  if (!shouldDelete) {
    console.log(
      report.orphaned.length
        ? `\nRead-only mode (default). Re-run with --delete --confirm to remove the ${report.orphaned.length} director${report.orphaned.length === 1 ? "y" : "ies"} listed above.`
        : "\nRead-only mode (default). Nothing to delete."
    );
    await mongoose.disconnect();
    return;
  }

  let deletedCount = 0;
  for (const o of report.orphaned) {
    try {
      fs.rmSync(path.join(VIDEOS_DIR, o.assetId), { recursive: true, force: true });
      deletedCount += 1;
      console.log(`Deleted ${o.assetId}`);
    } catch (err) {
      console.error(`Failed to delete ${o.assetId}:`, err.message);
    }
  }
  console.log(`\nDeleted ${deletedCount}/${report.orphaned.length} orphaned asset directories.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("findOrphanAssets failed:", err);
  process.exit(1);
});

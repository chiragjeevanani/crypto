/**
 * behaviorEngine.js
 *
 * KNQ Reels — Behaviour-based Recommendation Engine
 *
 * Responsibilities:
 *  1. recordBehaviorEvent   — update UserInterestProfile on every user action
 *  2. getPersonalizedFeed   — produce a ranked, diverse list of Post IDs
 *  3. computePostScore      — score a single post against a profile
 *
 * All category / media-type names are read dynamically from the database.
 * No values are hardcoded. New admin-created categories are picked up automatically.
 */

const Post = require("../models/Post");
const UserInterestProfile = require("../models/UserInterestProfile");

// ─── Configurable weights ────────────────────────────────────────────────────
const W = {
  // Final score component weights (must sum ≈ 1)
  CATEGORY: 0.30,
  MEDIA_TYPE: 0.20,
  COMBINATION: 0.15, // mediaType::category combined key
  SUBCATEGORY: 0.12,
  CREATOR: 0.12,
  QUALITY: 0.06,
  FRESHNESS: 0.05,

  // Behavior event base scores (before watch-% adjustment)
  WATCH_FULL: 12,       // ≥ 90% watched
  WATCH_HALF: 6,        // 40–89%
  WATCH_SKIP: -4,       // < 20% watched
  LIKE: 10,
  SAVE: 14,
  SHARE: 16,
  COMMENT: 8,
  NOT_INTERESTED_POST: 0,   // posts marked NI are only blocklisted
  NOT_INTERESTED_CATEGORY: -20, // applied to the category score

  // Decay
  LONG_TERM_DECAY_PER_DAY: 0.995, // multiply long-term scores per day since last update
  SESSION_DECAY_PER_HOUR: 0.80,   // multiply session scores per hour of inactivity

  // Score cap
  MAX_SCORE: 100,
  MIN_SCORE: 0,

  // Feed composition
  DISTRIBUTION_STRONG: 0.65,  // from top-interest categories
  DISTRIBUTION_RELATED: 0.20, // adjacent / medium-interest categories
  DISTRIBUTION_EXPLORE: 0.15, // trending / fresh / unexplored

  // Seen post cap
  SEEN_POSTS_MAX: 500,

  // Trending window
  TRENDING_HOURS: 48,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Clamp a numeric value between min and max */
const clamp = (v, min = W.MIN_SCORE, max = W.MAX_SCORE) =>
  Math.max(min, Math.min(max, v));

/** Exponential freshness decay — returns 0–1, highest for brand-new posts */
const freshnessScore = (createdAt) => {
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  return Math.exp(-hoursOld / 72); // half-life ≈ 72 hours
};

/** Logarithmic quality score based on engagement counts */
const qualityScore = (post) => {
  const likes = Number(post.likes || 0);
  const shares = Number(post.shares || 0);
  const saves = Number(post.saves || 0);
  const views = Number(post.views || 0);
  const engagement = likes + shares * 2 + saves * 3 + views * 0.01;
  return Math.min(1, Math.log10(1 + engagement) / 4); // normalised 0–1
};

/** Read a Map value safely (Mongoose Maps return undefined for missing keys) */
const mapGet = (map, key) => {
  if (!map || typeof map.get !== "function") return 0;
  return Number(map.get(String(key)) || 0);
};

/** Write to a Mongoose Map, clamped */
const mapSet = (map, key, value) => {
  map.set(String(key), clamp(value));
};

/** Increment a Mongoose Map entry by delta, clamped */
const mapInc = (map, key, delta) => {
  const current = mapGet(map, key);
  mapSet(map, key, current + delta);
};

/** Apply per-day long-term decay to all entries in a map */
const applyLongTermDecay = (map, daysSinceUpdate) => {
  if (!map || typeof map.forEach !== "function") return;
  const factor = Math.pow(W.LONG_TERM_DECAY_PER_DAY, daysSinceUpdate);
  map.forEach((value, key) => {
    map.set(key, clamp(Number(value) * factor));
  });
};

/** Apply per-hour session decay to all entries in a map */
const applySessionDecay = (map, hoursSinceSessionStart) => {
  if (!map || typeof map.forEach !== "function") return;
  const factor = Math.pow(W.SESSION_DECAY_PER_HOUR, hoursSinceSessionStart);
  map.forEach((value, key) => {
    map.set(key, clamp(Number(value) * factor));
  });
};

// ─── Combination key helper ───────────────────────────────────────────────────
const combKey = (mediaType, category) =>
  `${String(mediaType || "").toLowerCase()}::${String(category || "").toLowerCase()}`;

// ─── Load or create a UserInterestProfile ────────────────────────────────────
const getOrCreateProfile = async (userId) => {
  let profile = await UserInterestProfile.findOne({ userId });
  if (!profile) {
    profile = new UserInterestProfile({ userId });
    await profile.save();
  }
  return profile;
};

// ─── 1. Record a Behavior Event ──────────────────────────────────────────────

/**
 * recordBehaviorEvent
 *
 * @param {string} userId
 * @param {Object} post   — lean Post document (must include category, subcategory,
 *                          media.type, language, creator, _id)
 * @param {Object} event  — { type: string, watchPct?: number }
 *   event.type values: 'watch' | 'like' | 'save' | 'share' | 'comment'
 *                       | 'skip' | 'not_interested'
 */
const recordBehaviorEvent = async (userId, post, event) => {
  if (!userId || !post || !event?.type) return;

  const profile = await getOrCreateProfile(userId);

  // Apply decay since last update
  const now = Date.now();
  const daysSinceUpdate =
    (now - new Date(profile.lastUpdated).getTime()) / 86_400_000;
  const hoursSinceSession =
    (now - new Date(profile.sessionStartedAt).getTime()) / 3_600_000;

  if (daysSinceUpdate >= 1) {
    applyLongTermDecay(profile.categories, daysSinceUpdate);
    applyLongTermDecay(profile.mediaTypes, daysSinceUpdate);
    applyLongTermDecay(profile.subcategories, daysSinceUpdate);
    applyLongTermDecay(profile.languages, daysSinceUpdate);
    applyLongTermDecay(profile.creators, daysSinceUpdate);
    applyLongTermDecay(profile.combinations, daysSinceUpdate);
  }

  if (hoursSinceSession >= 1) {
    applySessionDecay(profile.sessionCategories, hoursSinceSession);
    applySessionDecay(profile.sessionMediaTypes, hoursSinceSession);
    applySessionDecay(profile.sessionCombinations, hoursSinceSession);
    profile.sessionStartedAt = new Date(now);
  }

  // Extract signals from post
  const mediaType = String(post.media?.type || "video");
  const category = String(post.category || "General");
  const subcategory = String(post.subcategory || "");
  const language = String(post.language || "English");
  const creatorId = post.creator?._id?.toString() || post.creator?.toString() || "";
  const ck = combKey(mediaType, category);

  // Resolve behavior score
  let score = 0;

  if (event.type === "watch") {
    const pct = Number(event.watchPct || 0);
    if (pct >= 90) score = W.WATCH_FULL;
    else if (pct >= 40) score = W.WATCH_HALF;
    else if (pct < 20) score = W.WATCH_SKIP; // negative
  } else if (event.type === "like") {
    score = W.LIKE;
  } else if (event.type === "save") {
    score = W.SAVE;
  } else if (event.type === "share") {
    score = W.SHARE;
  } else if (event.type === "comment") {
    score = W.COMMENT;
  } else if (event.type === "not_interested") {
    // Blocklist this post and apply category penalty
    const postIdStr = post._id?.toString() || post.id;
    if (postIdStr && !profile.negativePosts.map(id => id.toString()).includes(postIdStr)) {
      profile.negativePosts.push(post._id || post.id);
    }
    mapInc(profile.negativeCategories, category, Math.abs(W.NOT_INTERESTED_CATEGORY));
    // Do NOT increase seen posts here — we handle it below after all types
    profile.markModified("negativeCategories");
    profile.markModified("negativePosts");
    profile.lastUpdated = new Date(now);
    await profile.save();
    return;
  }

  if (score !== 0) {
    // Update long-term scores
    mapInc(profile.mediaTypes, mediaType, score * W.MEDIA_TYPE * 10);
    mapInc(profile.categories, category, score * W.CATEGORY * 10);
    if (subcategory) mapInc(profile.subcategories, subcategory, score * W.SUBCATEGORY * 10);
    if (language) mapInc(profile.languages, language, score * 0.02 * 10);
    if (creatorId) mapInc(profile.creators, creatorId, score * W.CREATOR * 10);
    mapInc(profile.combinations, ck, score * W.COMBINATION * 10);

    // Update session scores (stronger immediate effect)
    mapInc(profile.sessionCategories, category, score * 1.5);
    mapInc(profile.sessionMediaTypes, mediaType, score * 1.5);
    mapInc(profile.sessionCombinations, ck, score * 1.5);
  }

  // Add post to seenPostIds (cap at SEEN_POSTS_MAX)
  const postIdStr = post._id?.toString() || post.id;
  if (postIdStr) {
    const seenIds = profile.seenPostIds.map(id => id.toString());
    if (!seenIds.includes(postIdStr)) {
      profile.seenPostIds.push(post._id || post.id);
      if (profile.seenPostIds.length > W.SEEN_POSTS_MAX) {
        profile.seenPostIds = profile.seenPostIds.slice(-W.SEEN_POSTS_MAX);
      }
    }
  }

  // Mark Maps as modified for Mongoose change detection
  profile.markModified("mediaTypes");
  profile.markModified("categories");
  profile.markModified("subcategories");
  profile.markModified("languages");
  profile.markModified("creators");
  profile.markModified("combinations");
  profile.markModified("sessionCategories");
  profile.markModified("sessionMediaTypes");
  profile.markModified("sessionCombinations");
  profile.markModified("seenPostIds");
  profile.lastUpdated = new Date(now);

  await profile.save();
};

// ─── 2. Compute a Post's Personalization Score ───────────────────────────────

/**
 * computePostScore
 *
 * Returns a normalized score 0–100 for how well a post matches the user profile.
 */
const computePostScore = (post, profile) => {
  const mediaType = String(post.media?.type || "video");
  const category = String(post.category || "General");
  const subcategory = String(post.subcategory || "");
  const creatorId = post.creator?._id?.toString() || post.creator?.toString() || "";
  const ck = combKey(mediaType, category);

  // Normalize long-term scores (0–100 raw → 0–1 for weighting)
  const catScore = clamp(mapGet(profile.categories, category)) / 100;
  const typeScore = clamp(mapGet(profile.mediaTypes, mediaType)) / 100;
  const combScore = clamp(mapGet(profile.combinations, ck)) / 100;
  const subScore = subcategory ? clamp(mapGet(profile.subcategories, subcategory)) / 100 : 0;
  const creatorScore = creatorId ? clamp(mapGet(profile.creators, creatorId)) / 100 : 0;
  const negCatScore = clamp(mapGet(profile.negativeCategories, category)) / 100;

  // Session boost (session scores are raw values, cap at 50 for normalization)
  const sessionCatBoost = Math.min(mapGet(profile.sessionCategories, category), 50) / 50;
  const effectiveCatScore = Math.min(1, catScore * 0.7 + sessionCatBoost * 0.3);

  const quality = qualityScore(post);
  const freshness = freshnessScore(post.createdAt);

  const raw =
    effectiveCatScore * W.CATEGORY +
    typeScore * W.MEDIA_TYPE +
    combScore * W.COMBINATION +
    subScore * W.SUBCATEGORY +
    creatorScore * W.CREATOR +
    quality * W.QUALITY +
    freshness * W.FRESHNESS;

  const penalty = negCatScore * 0.5; // reduce score by up to 50% for negative categories
  return clamp((raw - penalty) * 100, 0, 100);
};

// ─── 3. Generate Personalized Feed ───────────────────────────────────────────

/**
 * getPersonalizedFeed
 *
 * @param {string|null} userId
 * @param {number} limit
 * @param {number} page
 * @returns {Promise<Object[]>}  Array of Post documents (lean)
 */
const getPersonalizedFeed = async (userId, limit = 10, page = 1) => {
  // Base query for all eligible posts
  const baseFilter = {
    status: "approved",
    isPublished: true,
    "media.type": "video",
    isNFT: { $ne: true }
  };

  // Cold start — no user or no profile yet
  if (!userId) {
    return getColdStartFeed(baseFilter, limit, page);
  }

  const profile = await UserInterestProfile.findOne({ userId }).lean();

  if (!profile || isEmptyProfile(profile)) {
    return getColdStartFeed(baseFilter, limit, page);
  }

  // Build seen post exclusion set
  const seenIds = (profile.seenPostIds || []).map(id => id.toString());

  // ── Determine top categories by blended score ──────────────────────────────
  const categoryScores = mergeMaps(profile.categories, profile.sessionCategories, 0.7, 0.3);
  const sortedCategories = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a);

  const topCategories = sortedCategories.slice(0, 3).map(([k]) => k);
  const relatedCategories = sortedCategories.slice(3, 6).map(([k]) => k);

  // ── Determine top media types ──────────────────────────────────────────────
  const mediaTypeScores = mergeMaps(profile.mediaTypes, profile.sessionMediaTypes, 0.7, 0.3);
  const topMediaTypes = Object.entries(mediaTypeScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([k]) => k);
  // Always include "video" since that's what the reel feed shows
  if (!topMediaTypes.includes("video")) topMediaTypes.unshift("video");

  // ── Build negative post exclusion ─────────────────────────────────────────
  const negativePostIds = (profile.negativePosts || []).map(id => id.toString());
  const excludeIds = [...new Set([...seenIds, ...negativePostIds])];

  // ── Candidate generation ───────────────────────────────────────────────────
  const totalNeeded = limit * 4; // over-fetch to allow scoring + diversity trim
  const strongCount = Math.ceil(totalNeeded * W.DISTRIBUTION_STRONG);
  const relatedCount = Math.ceil(totalNeeded * W.DISTRIBUTION_RELATED);
  const exploreCount = Math.ceil(totalNeeded * W.DISTRIBUTION_EXPLORE);

  const strongFilter = {
    ...baseFilter,
    category: topCategories.length ? { $in: topCategories } : undefined,
  };
  if (!topCategories.length) delete strongFilter.category;

  const relatedFilter = {
    ...baseFilter,
    category: relatedCategories.length ? { $in: relatedCategories } : { $nin: topCategories },
  };

  // Trending: high engagement in last TRENDING_HOURS hours
  const trendingCutoff = new Date(Date.now() - W.TRENDING_HOURS * 3_600_000);
  const exploreFilter = {
    ...baseFilter,
    createdAt: { $gte: trendingCutoff }
  };

  const [strongPosts, relatedPosts, explorePosts] = await Promise.all([
    fetchCandidates(strongFilter, excludeIds, strongCount),
    fetchCandidates(relatedFilter, excludeIds, relatedCount),
    fetchCandidates(exploreFilter, excludeIds, exploreCount)
  ]);

  // ── Score & rank ───────────────────────────────────────────────────────────
  const profileForScoring = {
    categories: objectToMap(profile.categories),
    mediaTypes: objectToMap(profile.mediaTypes),
    subcategories: objectToMap(profile.subcategories),
    languages: objectToMap(profile.languages),
    creators: objectToMap(profile.creators),
    combinations: objectToMap(profile.combinations),
    sessionCategories: objectToMap(profile.sessionCategories),
    sessionMediaTypes: objectToMap(profile.sessionMediaTypes),
    sessionCombinations: objectToMap(profile.sessionCombinations),
    negativeCategories: objectToMap(profile.negativeCategories)
  };

  const scoredStrong = scoreAndSort(strongPosts, profileForScoring);
  const scoredRelated = scoreAndSort(relatedPosts, profileForScoring);
  const scoredExplore = scoreAndSort(explorePosts, profileForScoring);

  // ── Merge with diversity ───────────────────────────────────────────────────
  const merged = mergeDiverse(
    scoredStrong.slice(0, strongCount),
    scoredRelated.slice(0, relatedCount),
    scoredExplore.slice(0, exploreCount),
    limit,
    page
  );

  return merged;
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Fetch candidate posts, excluding seen/negative IDs */
const fetchCandidates = async (filter, excludeIds, count) => {
  const q = { ...filter };
  if (excludeIds.length) {
    q._id = { $nin: excludeIds };
  }
  return Post.find(q)
    .sort({ createdAt: -1 })
    .limit(count)
    .populate("creator", "name handle avatar role earningCoins isPremium")
    .populate("campaign", "title brandName bannerUrl rewardDetails status isActive")
    .populate("musicId", "title artist audioUrl duration thumbnail")
    .lean();
};

/** Score all posts and return sorted desc */
const scoreAndSort = (posts, profile) => {
  return posts
    .map(post => ({ post, score: computePostScore(post, profile) }))
    .sort((a, b) => b.score - a.score)
    .map(({ post }) => post);
};

/** Merge strong, related, explore lists into a diverse paginated result */
const mergeDiverse = (strong, related, explore, limit, page) => {
  const seen = new Set();
  const result = [];

  const addUnique = (arr) => {
    for (const post of arr) {
      const id = post._id?.toString();
      if (!seen.has(id)) {
        seen.add(id);
        result.push(post);
      }
    }
  };

  // Interleave: strong, strong, related, explore, strong, strong, related ...
  const maxLen = Math.max(strong.length, related.length, explore.length);
  let si = 0, ri = 0, ei = 0;
  for (let i = 0; i < maxLen * 3 && result.length < limit * page; i++) {
    if (i % 6 < 4 && si < strong.length) addUnique([strong[si++]]);
    else if (i % 6 < 5 && ri < related.length) addUnique([related[ri++]]);
    else if (ei < explore.length) addUnique([explore[ei++]]);
  }

  // Fallback fill if we're short
  addUnique(strong.slice(si));
  addUnique(related.slice(ri));
  addUnique(explore.slice(ei));

  const skip = (page - 1) * limit;
  return result.slice(skip, skip + limit);
};

/** Cold-start feed: trending + fresh + diverse */
const getColdStartFeed = async (baseFilter, limit, page) => {
  const skip = (page - 1) * limit;
  return Post.find(baseFilter)
    .sort({ views: -1, likes: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("creator", "name handle avatar role earningCoins isPremium")
    .populate("campaign", "title brandName bannerUrl rewardDetails status isActive")
    .populate("musicId", "title artist audioUrl duration thumbnail")
    .lean();
};

/** Check if a profile has any meaningful data */
const isEmptyProfile = (profile) => {
  const hasCategories =
    profile.categories && Object.keys(profile.categories).length > 0;
  const hasMediaTypes =
    profile.mediaTypes && Object.keys(profile.mediaTypes).length > 0;
  return !hasCategories && !hasMediaTypes;
};

/** Merge two plain objects (from .lean()) with weights into a plain object */
const mergeMaps = (longTerm = {}, session = {}, ltWeight = 0.7, sWeight = 0.3) => {
  const result = {};
  const keys = new Set([...Object.keys(longTerm), ...Object.keys(session)]);
  keys.forEach(k => {
    result[k] = (Number(longTerm[k] || 0) * ltWeight) + (Number(session[k] || 0) * sWeight);
  });
  return result;
};

/** Convert plain object (from lean()) to a Map-like accessor */
const objectToMap = (obj = {}) => ({
  get: (key) => Number(obj[String(key)] || 0)
});

module.exports = {
  recordBehaviorEvent,
  getPersonalizedFeed,
  computePostScore,
};

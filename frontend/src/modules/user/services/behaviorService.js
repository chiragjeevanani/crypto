/**
 * behaviorService.js
 *
 * Fire-and-forget client for the KNQ Reels behavior recommendation API.
 * All calls are non-blocking — they never throw errors that affect the UI.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BEHAVIOR_BASE = `${API_BASE}/user/behavior`;

import { getStoredToken } from "../store/useUserStore";

const getAuthHeaders = () => {
  const raw = getStoredToken();
  return raw
    ? { Authorization: `Bearer ${raw}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
};

/**
 * Record a behavior event against a post.
 *
 * @param {string} postId
 * @param {'watch'|'like'|'save'|'share'|'comment'|'skip'|'not_interested'} eventType
 * @param {number} [watchPct]  0–100, only relevant for eventType === 'watch'
 */
const recordEvent = (postId, eventType, watchPct = 0) => {
  if (!postId || !eventType) return;
  try {
    fetch(`${BEHAVIOR_BASE}/event`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ postId, eventType, watchPct }),
      // keepalive ensures the request completes even if the user navigates away
      keepalive: true,
    }).catch(() => {
      /* fire-and-forget — ignore network errors */
    });
  } catch {
    /* never throw from behavior tracking */
  }
};

/**
 * Mark a post as "Not Interested".
 * Blocks the post from future feeds and applies a soft negative category signal.
 *
 * @param {string} postId
 */
const markNotInterested = (postId) => {
  if (!postId) return;
  try {
    fetch(`${BEHAVIOR_BASE}/not-interested`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ postId }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never throw */
  }
};

/**
 * Fetch the current user's interest profile scores.
 * Used for debugging or displaying personalization stats.
 *
 * @returns {Promise<Object|null>}
 */
const getProfile = async () => {
  try {
    const res = await fetch(`${BEHAVIOR_BASE}/profile`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.profile ?? null;
  } catch {
    return null;
  }
};

export const behaviorService = {
  recordEvent,
  markNotInterested,
  getProfile,
};

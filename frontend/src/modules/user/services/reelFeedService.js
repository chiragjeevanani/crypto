const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const REELS_FEED = `${API_BASE}/user/reels-feed`;

import { getStoredToken } from '../store/useUserStore';

const getAuthHeaders = () => {
    const raw = getStoredToken();
    return raw ? { Authorization: `Bearer ${raw}` } : {};
};

const handle = async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to load reels feed");
    return data;
};

export const reelFeedService = {
    async getFeed(interval = 6, page = 1, limit = 10) {
        const response = await fetch(`${REELS_FEED}?interval=${interval}&page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
        const data = await handle(response);
        return data; // returning the full data object to access .items, .page, .hasMore
    }
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SEARCH_URL = `${API_BASE}/user/search`;

import { getStoredToken } from '../store/useUserStore';

const getAuthHeaders = () => {
  const raw = getStoredToken();
  return raw ? { Authorization: `Bearer ${raw}` } : {};
};

export const searchService = {
  async search(query) {
    const response = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to search");
    return data;
  },
  async getSuggestedUsers() {
    const response = await fetch(`${SEARCH_URL}/suggested-users`, {
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to fetch suggested users");
    return data;
  },
  async getSuggestedReels() {
    const response = await fetch(`${SEARCH_URL}/suggested-reels`, {
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to fetch suggested reels");
    return data;
  },
  async dismissSuggestedUser(userId) {
    const response = await fetch(`${SEARCH_URL}/suggested-users/dismiss/${userId}`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to dismiss user");
    return data;
  },
  async getUserById(userId) {
    const response = await fetch(`${SEARCH_URL}/${userId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to fetch user");
    return data;
  }
};

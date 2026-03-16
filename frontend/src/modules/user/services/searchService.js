const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SEARCH_URL = `${API_BASE}/user/search`;

const getAuthHeaders = () => {
  const raw = localStorage.getItem("crypto_auth_token");
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
  }
};

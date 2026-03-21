const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SAVED_URL = `${API_BASE}/saved`;

const getAuthHeaders = () => {
  const raw = localStorage.getItem("crypto_auth_token");
  return raw ? { Authorization: `Bearer ${raw}` } : {};
};

export const savedPostService = {
  async toggleSave(postId) {
    const response = await fetch(`${SAVED_URL}/toggle`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ postId })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to toggle save");
    return data;
  },

  async getSavedPostIds() {
    const response = await fetch(`${SAVED_URL}/ids`, {
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to fetch saved post IDs");
    return data;
  },

  async getSavedPosts(userId, page = 1, limit = 20) {
    const response = await fetch(`${SAVED_URL}/${userId}?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to fetch saved posts");
    return data;
  }
};

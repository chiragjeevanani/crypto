const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const USER_FOLLOW = `${API_BASE}/user/follow`;

const getAuthHeaders = () => {
  const raw = localStorage.getItem("crypto_auth_token");
  return raw ? { Authorization: `Bearer ${raw}` } : {};
};

export const followService = {
  async toggleFollow(userId) {
    const response = await fetch(`${USER_FOLLOW}/${userId}/toggle`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to update follow");
    return data;
  },

  async getFollowers(userId) {
    const response = await fetch(`${USER_FOLLOW}/${userId}/followers`, {
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to load followers");
    return data;
  },

  async getFollowing(userId) {
    const response = await fetch(`${USER_FOLLOW}/${userId}/following`, {
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to load following");
    return data;
  }
};


const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const USER_POSTS = `${API_BASE}/user/posts`;

const getAuthHeaders = () => {
  const raw = localStorage.getItem("crypto_auth_token");
  return raw ? { Authorization: `Bearer ${raw}` } : {};
};

export const postService = {
  async createPost(formData) {
    const response = await fetch(USER_POSTS, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to create post");
    return data;
  },

  async getPosts() {
    const response = await fetch(USER_POSTS, { headers: getAuthHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to load posts");
    return data;
  },

  async getPostById(id) {
    const response = await fetch(`${USER_POSTS}/${id}`, { headers: getAuthHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to load post");
    return data;
  },

  async likePost(id) {
    const response = await fetch(`${USER_POSTS}/${id}/like`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to update like");
    return data;
  },

  async getComments(id) {
    const response = await fetch(`${USER_POSTS}/${id}/comments`, { headers: getAuthHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to load comments");
    return data;
  },

  async addComment(id, text) {
    const response = await fetch(`${USER_POSTS}/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ text })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to add comment");
    return data;
  },

  async sharePost(id) {
    const response = await fetch(`${USER_POSTS}/${id}/share`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to record share");
    return data;
  }
};

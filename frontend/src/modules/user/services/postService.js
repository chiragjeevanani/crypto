const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const USER_POSTS = `${API_BASE}/user/posts`;

import { getStoredToken } from '../store/useUserStore';

const getAuthHeaders = () => {
    const raw = getStoredToken();
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
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to create post");
    return data;
  },

  async getPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${USER_POSTS}?${query}` : USER_POSTS;
    const response = await fetch(url, { headers: getAuthHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to load posts");
    return data;
  },

  async getPostById(id) {
    const response = await fetch(`${USER_POSTS}/${id}`, { headers: getAuthHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to load post");
    return data;
  },

  async getMyNFTs() {
    const response = await fetch(`${USER_POSTS}/my-nfts`, { headers: getAuthHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to load your NFTs");
    return data;
  },

  async getMyCollection() {
    const response = await fetch(`${USER_POSTS}/my-collection`, { headers: getAuthHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to load your collection");
    return data;
  },

  async likePost(id) {
    const response = await fetch(`${USER_POSTS}/${id}/like`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to update like");
    return data;
  },

  async getComments(id) {
    const response = await fetch(`${USER_POSTS}/${id}/comments`, { headers: getAuthHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to load comments");
    return data;
  },

  async addComment(id, text) {
    const response = await fetch(`${USER_POSTS}/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ text })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to add comment");
    return data;
  },

  async sharePost(id) {
    const response = await fetch(`${USER_POSTS}/${id}/share`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to record share");
    return data;
  },

  async recordView(id) {
    const response = await fetch(`${USER_POSTS}/${id}/view`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to record view");
    return data;
  },

  async reportPost(id, reason, description) {
    const response = await fetch(`${USER_POSTS}/${id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ reason, description })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to submit report");
    return data;
  },

  async deletePost(id) {
    const response = await fetch(`${USER_POSTS}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to delete post");
    return data;
  },

  // ─── NFT Resale & Offers ────────────────────────────────────────────────

  async getMarketplace() {
    const response = await fetch(`${API_BASE}/nft/marketplace`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to load marketplace");
    return data;
  },

  async getResaleListings() {
    const response = await fetch(`${API_BASE}/nft/resale-listings`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to load resale listings");
    return data;
  },

  async relistNft(collectibleId, price) {
    const response = await fetch(`${API_BASE}/nft/${collectibleId}/relist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ price })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to relist NFT");
    return data;
  },

  async buyResaleNft(collectibleId) {
    const response = await fetch(`${API_BASE}/nft/${collectibleId}/buy-resale`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to purchase NFT");
    return data;
  },

  async placeOffer(collectibleId, amount) {
    const response = await fetch(`${API_BASE}/nft/${collectibleId}/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ amount })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to place offer");
    return data;
  },

  async getOffersForCollectible(collectibleId) {
    const response = await fetch(`${API_BASE}/nft/${collectibleId}/offers`, {
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to fetch offers");
    return data;
  },

  async getMyOffers() {
    const response = await fetch(`${API_BASE}/nft/my/offers`, {
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to fetch your offers");
    return data;
  },

  async acceptOffer(collectibleId, offerId) {
    const response = await fetch(`${API_BASE}/nft/${collectibleId}/offer/${offerId}/accept`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to accept offer");
    return data;
  },

  async cancelOffer(collectibleId, offerId) {
    const response = await fetch(`${API_BASE}/nft/${collectibleId}/offer/${offerId}/cancel`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to cancel offer");
    return data;
  },

  async cancelOffer(collectibleId, offerId) {
    const response = await fetch(`${API_BASE}/nft/${collectibleId}/offer/${offerId}/cancel`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data?.message || "Failed to cancel offer");
    return data;
  }
};

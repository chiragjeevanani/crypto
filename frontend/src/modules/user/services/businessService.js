const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BUSINESS_URL = `${API_BASE}/business`;

const getAuthHeaders = () => {
  const raw = localStorage.getItem("crypto_auth_token");
  return raw ? { Authorization: `Bearer ${raw}` } : {};
};

export const businessService = {
  async initiatePayment(postId) {
    const response = await fetch(`${BUSINESS_URL}/initiate-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ postId })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to initiate payment");
    return data;
  },

  async verifyPayment(verificationData) {
    const response = await fetch(`${BUSINESS_URL}/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(verificationData)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Failed to verify payment");
    return data;
  }
};

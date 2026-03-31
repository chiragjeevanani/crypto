const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ADMIN_FINANCE = `${API_BASE}/admin/transactions`;

const getAuthHeaders = () => {
    const raw = localStorage.getItem("crypto_auth_token");
    return raw ? { Authorization: `Bearer ${raw}` } : {};
};

export const financialService = {
    async fetchDeposits(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${ADMIN_FINANCE}/deposits?${query}`, { headers: getAuthHeaders() });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || "Failed to load deposits");
        return data.transactions || [];
    },

    async fetchGiftHistory(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${ADMIN_FINANCE}/gifts/history?${query}`, { headers: getAuthHeaders() });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || "Failed to load gift history");
        return data.history || [];
    }
};

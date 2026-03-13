const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ADMIN_GIFTS = `${API_BASE}/admin/gifts`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('crypto_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const calculateGiftRevenue = (gift) => {
    return (gift.price * (gift.usage || 0));
};

export const giftService = {
    fetchGifts: async () => {
        const res = await fetch(ADMIN_GIFTS, { headers: getAuthHeaders() });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load gifts");
        return data.gifts || [];
    },

    fetchTrashGifts: async () => {
        const res = await fetch(`${ADMIN_GIFTS}/trash`, { headers: getAuthHeaders() });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load gift trash");
        return data.gifts || [];
    },

    createGift: async (giftData) => {
        const res = await fetch(ADMIN_GIFTS, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders()
            },
            body: JSON.stringify(giftData)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to create gift");
        return data.gift;
    },

    updateGift: async (id, giftData) => {
        const res = await fetch(`${ADMIN_GIFTS}/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders()
            },
            body: JSON.stringify(giftData)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to update gift");
        return data.gift;
    },

    deleteGift: async (id) => {
        const res = await fetch(`${ADMIN_GIFTS}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.message || "Failed to delete gift");
        }
        return true;
    },

    restoreGift: async (id) => {
        const res = await fetch(`${ADMIN_GIFTS}/${id}/restore`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to restore gift");
        return data.gift;
    },

    permanentlyDeleteGift: async (id) => {
        const res = await fetch(`${ADMIN_GIFTS}/${id}/permanent`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.message || "Failed to permanently delete gift");
        }
        return true;
    },

    toggleStatus: async (id) => {
        const res = await fetch(`${ADMIN_GIFTS}/${id}/toggle`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to toggle gift");
        return data.gift;
    }
};

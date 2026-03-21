const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const MUSIC_URL = `${API_BASE}/music`;

const getAuthHeaders = () => {
    const raw = localStorage.getItem("crypto_auth_token");
    return raw ? { Authorization: `Bearer ${raw}` } : {};
};

export const musicService = {
    async getActiveMusic(page = 1, search = "") {
        const url = `${MUSIC_URL}?page=${page}&search=${search}`;
        const response = await fetch(url, { headers: getAuthHeaders() });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || "Failed to load music");
        return data;
    }
};

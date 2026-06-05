import { getStoredToken } from '../store/useUserStore';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
    const raw = getStoredToken();
    return raw ? { Authorization: `Bearer ${raw}` } : {};
};

export const agoraService = {
    async getToken(channelName, uid = 0) {
        const response = await fetch(`${API_BASE}/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${uid}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "Failed to fetch Agora token");
        return data; // { token, channelName, uid }
    }
};

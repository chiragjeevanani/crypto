const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const NOTIFS_URL = `${API_BASE}/notifications`;

import { getStoredToken } from '../store/useUserStore';

const getAuthHeaders = () => {
    const raw = getStoredToken();
    return raw ? { Authorization: `Bearer ${raw}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export const notificationService = {
    async getNotifications({ page = 1, limit = 20 } = {}) {
        const res = await fetch(`${NOTIFS_URL}?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders()
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load notifications");
        return data;
    },

    async getUnreadCount() {
        const res = await fetch(`${NOTIFS_URL}/unread-count`, {
            headers: getAuthHeaders()
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to fetch unread count");
        return data;
    },

    async markOneRead(id) {
        const res = await fetch(`${NOTIFS_URL}/${id}/read`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to mark as read");
        return data;
    },

    async markAllRead() {
        const res = await fetch(`${NOTIFS_URL}/read-all`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to mark all as read");
        return data;
    },

    async getSuggestions() {
        const res = await fetch(`${NOTIFS_URL}/suggestions`, {
            headers: getAuthHeaders()
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load suggestions");
        return data;
    }
};

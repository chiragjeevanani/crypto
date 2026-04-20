const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ADMIN_NOTIFICATIONS = `${API_BASE}/admin/notifications`;

import { getStoredToken } from '../../user/store/useUserStore';

const getAuthHeaders = () => {
    const token = getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const notificationService = {
    async fetchNotifications(page = 1) {
        const res = await fetch(`${ADMIN_NOTIFICATIONS}?page=${page}`, { 
            headers: getAuthHeaders() 
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load notifications");
        return data;
    },

    async markAsRead(id) {
        const res = await fetch(`${ADMIN_NOTIFICATIONS}/${id}/read`, { 
            method: "PATCH",
            headers: getAuthHeaders() 
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to mark as read");
        return data.success;
    },

    async deleteNotification(id) {
        const res = await fetch(`${ADMIN_NOTIFICATIONS}/${id}`, { 
            method: "DELETE",
            headers: getAuthHeaders() 
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to delete notification");
        return data.success;
    }
};

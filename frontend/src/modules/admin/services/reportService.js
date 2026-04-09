import { getStoredToken } from '../../user/store/useUserStore';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5004/api";
const REPORTS_URL = `${API_BASE}/admin/reports`;

const getAuthHeaders = () => {
    const token = getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const reportService = {
    async fetchReports() {
        const res = await fetch(REPORTS_URL, { headers: getAuthHeaders() });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load reports");
        return data.reports || [];
    },

    async handleAction(id, action) {
        const res = await fetch(`${REPORTS_URL}/${id}/action`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ action })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || `Failed to ${action} report`);
        return data;
    }
};

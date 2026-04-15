const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ADMIN_CONTENT = `${API_BASE}/admin/content`;

import { getStoredToken } from '../../user/store/useUserStore';

const getAuthHeaders = () => {
    const token = getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const moderationService = {
    async fetchPosts(params = {}) {
        const q = new URLSearchParams();
        if (params.creator) q.set("creator", params.creator);
        if (params.status) q.set("status", params.status);
        if (params.isNFT === true || params.isNFT === "true") q.set("isNFT", "true");
        if (params.isBusiness === true || params.isBusiness === "true") q.set("isBusiness", "true");
        const url = q.toString() ? `${ADMIN_CONTENT}?${q.toString()}` : ADMIN_CONTENT;
        const res = await fetch(url, { headers: getAuthHeaders() });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load content");
        return data.posts || [];
    },

    async fetchPostDetail(id) {
        const res = await fetch(`${ADMIN_CONTENT}/${id}`, { headers: getAuthHeaders() });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.post) return null;
        const p = data.post;
        return {
            id: p.id,
            author: p.author ?? p.creator?.handle ?? p.creator?.username,
            type: p.type ?? (p.media?.type === "video" ? "Video" : p.media?.type === "audio" ? "Audio" : "Image"),
            content: p.content ?? p.caption,
            flagReason: p.flagReason ?? "Pending review",
            status: p.status ?? "Pending",
            thumbnail: p.thumbnail ?? p.media?.url,
            mediaUrl: p.mediaUrl ?? p.media?.url,
            mediaType: p.mediaType ?? (p.media?.type || "image"),
            isBusiness: Boolean(p.isBusiness),
            paymentStatus: p.paymentStatus || "pending",
            promotion: p.promotion || null,
            createdAt: p.createdAt,
            reportCount: p.reportCount ?? 0,
            aiRiskScore: p.aiRiskScore ?? "—",
            moderationNotes: p.isBusiness ? "Business Promotion: Review ad budget and content." : (p.moderationNotes ?? "Review and approve or reject."),
            authorStats: p.authorStats ?? { followers: 0, posts: 0, previousFlags: 0 },
            reports: p.reports ?? []
        };
    },

    async approvePost(id) {
        const res = await fetch(`${ADMIN_CONTENT}/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({ approved: true })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to approve");
        return data.post;
    },

    async rejectPost(id, reason) {
        const res = await fetch(`${ADMIN_CONTENT}/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({ approved: false, reason: reason || "" })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to reject");
        return data.post;
    },

    async softDelete(id) {
        const res = await fetch(`${ADMIN_CONTENT}/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({ approved: false, reason: "Removed by admin" })
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.message || "Failed to remove");
        }
        return true;
    },

    async fetchStats() {
        const res = await fetch(`${ADMIN_CONTENT}/stats`, { headers: getAuthHeaders() });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load stats");
        return data.stats;
    },
    async acknowledgeAds() {
        const res = await fetch(`${ADMIN_CONTENT}/acknowledge-ads`, { 
            method: "POST",
            headers: getAuthHeaders() 
        });
        const data = await res.json().catch(() => ({}));
        return data.success;
    }
};

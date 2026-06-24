const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ADMIN_USERS = `${API_BASE}/admin/users`;
const ADMIN_KYC = `${API_BASE}/admin/kyc`;

import { getStoredToken } from '../../user/store/useUserStore';

const getAuthHeaders = () => {
    const raw = getStoredToken();
    return raw ? { Authorization: `Bearer ${raw}` } : {};
};

const fetchApi = async (url, options = {}) => {
    const res = await fetch(url, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...(options.headers || {})
        }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "API request failed");
    return data;
};

export const userService = {
    fetchUsers: async (params = {}) => {
        const { search = '', role = 'all', status = 'all', kyc = 'all', page = 1, limit = 10, flagged = false } = params;
        const query = new URLSearchParams();
        if (search) query.set("search", search);
        if (role && role !== 'all') query.set("role", role);
        if (status && status !== 'all') query.set("status", status);
        if (kyc && kyc !== 'all') query.set("kyc", kyc);
        query.set("page", String(page));
        query.set("limit", String(limit));
        if (flagged) query.set("flagged", "true");

        const data = await fetchApi(`${ADMIN_USERS}?${query.toString()}`);
        return {
            users: data.users || [],
            total: data.total || 0,
            page: data.page || page,
            totalPages: data.totalPages || 1,
        };
    },

    fetchUserDetail: async (id) => {
        const data = await fetchApi(`${ADMIN_USERS}/${id}`);
        return data.user;
    },

    fetchUserFollowers: async (userId) => {
        const data = await fetchApi(`${ADMIN_USERS}/${userId}/followers`);
        return { count: data.count ?? 0, followers: data.followers ?? [] };
    },

    fetchUserFollowing: async (userId) => {
        const data = await fetchApi(`${ADMIN_USERS}/${userId}/following`);
        return { count: data.count ?? 0, following: data.following ?? [] };
    },

    toggleBan: async (id) => {
        const data = await fetchApi(`${ADMIN_USERS}/${id}/ban`, { method: "PATCH" });
        return data.user;
    },

    markSuspicious: async (id) => {
        const data = await fetchApi(`${ADMIN_USERS}/${id}/suspicious`, { method: "PATCH" });
        return data.user;
    },

    fetchKYCQueue: async () => {
        const data = await fetchApi(ADMIN_KYC);
        return data.submissions.map(s => ({
            id: s._id,
            userId: s.userId?._id || s.userId,
            user: s.userId?.name || 'User',
            docType: 'Aadhaar Front + Aadhaar Back',
            status: s.status,
            submittedAt: s.createdAt,
            referralCode: s.userId?.referralCode || '-',
            referredCount: s.userId?.referralCount || 0,
            requiredReferrals: 5,
            eligibleByReferral: (s.userId?.referralCount || 0) >= 5,
            aadharFront: s.documents?.aadharFrontUrl || '',
            aadharBack: s.documents?.aadharBackUrl || '',
        }));
    },

    verifyKYC: async (id) => {
        const data = await fetchApi(`${ADMIN_KYC}/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ submissionId: id, status: "verified" })
        });
        return data.submission;
    },

    updateUser: async (id, userData) => {
        const data = await fetchApi(`${ADMIN_USERS}/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });
        return data.user;
    },

    deleteUser: async (id) => {
        const data = await fetchApi(`${ADMIN_USERS}/${id}`, { method: "DELETE" });
        return data.user;
    },

    fetchSuspiciousUsers: async () => {
        const data = await fetchApi(`${ADMIN_USERS}?flagged=true`);
        return data.users || [];
    },

    createUser: async (userData) => {
        const data = await fetchApi(ADMIN_USERS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });
        return data.user;
    }
};

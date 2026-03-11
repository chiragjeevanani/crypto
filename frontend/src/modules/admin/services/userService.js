const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ADMIN_USERS = `${API_BASE}/admin/users`;
import { getKYCSubmissionByUser, getKYCSubmissions, patchKYCSubmission } from '../../../shared/kycSync'

const getAuthHeaders = () => {
    const raw = localStorage.getItem("crypto_auth_token");
    return raw ? { Authorization: `Bearer ${raw}` } : {};
};

export const userService = {
    fetchUsers: async (params = {}) => {
        const { search = '', role = 'all', status = 'all', kyc = 'all', page = 1, limit = 10 } = params;
        const query = new URLSearchParams();
        if (search) query.set("search", search);
        query.set("page", String(page));
        query.set("limit", String(limit));

        const response = await fetch(`${ADMIN_USERS}?${query.toString()}`, {
            headers: getAuthHeaders(),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data?.message || "Failed to load users");
        }

        // The backend already returns users in the shape expected by the admin UI.
        return {
            users: data.users || [],
            total: data.total || 0,
            page: data.page || page,
            totalPages: data.totalPages || 1,
        };
    },

    fetchUserDetail: async (id) => {
        const response = await fetch(`${ADMIN_USERS}/${id}`, {
            headers: getAuthHeaders(),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data?.message || "Identity node not found.");
        }
        return data.user;
    },

    fetchUserFollowers: async (userId) => {
        const response = await fetch(`${ADMIN_USERS}/${userId}/followers`, {
            headers: getAuthHeaders(),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || "Failed to load followers");
        return { count: data.count ?? 0, followers: data.followers ?? [] };
    },

    fetchUserFollowing: async (userId) => {
        const response = await fetch(`${ADMIN_USERS}/${userId}/following`, {
            headers: getAuthHeaders(),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || "Failed to load following");
        return { count: data.count ?? 0, following: data.following ?? [] };
    },

    toggleBan: async (id) => {
        await delay(1000);
        const user = mockUsers.find(u => u.id === id);
        if (user) {
            user.isBanned = !user.isBanned;
        }
        return user ? { ...user } : null;
    },

    markSuspicious: async (id) => {
        await delay(500);
        const user = mockUsers.find(u => u.id === id);
        if (user) {
            user.isSuspicious = !user.isSuspicious;
        }
        return user ? { ...user } : null;
    },

    verifyKYC: async (id) => {
        await delay(1200);
        const user = mockUsers.find(u => u.id === id);
        if (user) {
            if ((user.referredCount || 0) < 5) {
                throw new Error('KYC cannot be approved until at least 5 users join with this referral code.');
            }
            user.status = 'Verified';
            user.kycVerified = true;
            user.kycStatus = 'approved';
            return { ...user };
        }
        const synced = getKYCSubmissionByUser(id)
        if (!synced) return null
        if ((synced.referredCount || 0) < (synced.requiredReferrals || 5)) {
            throw new Error('KYC cannot be approved until at least 5 users join with this referral code.');
        }
        const updated = patchKYCSubmission(id, { status: 'approved', payoutsUnlocked: true })
        return updated ? { ...updated } : null
    },

    incrementReferral: async (id) => {
        await delay(500);
        const user = mockUsers.find(u => u.id === id);
        if (user) {
            user.referredCount = Math.min(25, (user.referredCount || 0) + 1);
            return { ...user };
        }
        const synced = getKYCSubmissionByUser(id)
        if (!synced) return null
        const required = synced.requiredReferrals || 5
        const nextCount = Math.min(100, (synced.referredCount || 0) + 1)
        const updated = patchKYCSubmission(id, {
            referredCount: nextCount,
            status: nextCount >= required ? 'pending' : synced.status,
        })
        return updated ? { ...updated } : null
    },

    fetchKYCQueue: async () => {
        await delay(700);
        const mockQueue = mockUsers
            .filter((u) => !u.kycVerified)
            .map((u, idx) => ({
                id: `KYC-${2000 + idx}`,
                userId: u.id,
                user: u.name,
                docType: 'Aadhaar Front + Aadhaar Back',
                status: u.kycStatus === 'rejected' ? 'rejected' : 'pending',
                submittedAt: '2026-02-27',
                referralCode: u.referralCode || '-',
                referredCount: u.referredCount || 0,
                requiredReferrals: 5,
                eligibleByReferral: (u.referredCount || 0) >= 5,
                aadharFront: u.aadharFront,
                aadharBack: u.aadharBack,
            }));
        const syncedQueue = getKYCSubmissions()
            .filter((entry) => entry.status !== 'approved')
            .map((entry, idx) => ({
                id: `KYC-EXT-${3000 + idx}`,
                userId: entry.userId,
                user: entry.user || 'User',
                docType: 'Aadhaar Front + Aadhaar Back',
                status: entry.status || 'pending',
                submittedAt: entry.submittedAt || '2026-02-28',
                referralCode: entry.referralCode || '-',
                referredCount: entry.referredCount || 0,
                requiredReferrals: entry.requiredReferrals || 5,
                eligibleByReferral: (entry.referredCount || 0) >= (entry.requiredReferrals || 5),
                aadharFront: entry.aadharFront || '#',
                aadharBack: entry.aadharBack || '#',
            }))
        return [...syncedQueue, ...mockQueue]
    },

    updateUser: async (id, userData) => {
        await delay(1000);
        mockUsers = mockUsers.map(u => u.id === id ? { ...u, ...userData } : u);
        return mockUsers.find(u => u.id === id);
    },

    deleteUser: async (id) => {
        await delay(900);
        const existing = mockUsers.find((u) => u.id === id);
        if (!existing) return null;
        mockUsers = mockUsers.filter((u) => u.id !== id);
        return { ...existing };
    },

    fetchSuspiciousUsers: async () => {
        await delay(1100);
        return mockUsers.filter(u => u.riskScore === 'High' || u.isSuspicious).map(u => ({ ...u }));
    }
};

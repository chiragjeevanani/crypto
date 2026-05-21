const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

import { getStoredToken } from '../../user/store/useUserStore';

const getToken = () => getStoredToken();

const request = async (path, options = {}) => {
    let response;
    try {
        response = await fetch(`${API_BASE}${path}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
                ...(options.headers || {})
            },
            ...options
        });
    } catch (err) {
        const msg = err?.message || "";
        if (msg === "Failed to fetch" || err?.name === "TypeError") {
            throw new Error("Cannot connect to server. Check that the backend is running and the API URL is correct.");
        }
        throw new Error(err?.message || "Network error");
    }

    let data;
    try {
        data = await response.json();
    } catch {
        if (!response.ok) {
            throw new Error(response.status === 502 ? "Server unavailable. Try again later." : "Request failed");
        }
        throw new Error("Invalid response from server");
    }

    if (!response.ok) {
        throw new Error(data?.message || "Request failed");
    }
    return data;
};

const mapStatus = (status) => {
    if (status === "success") return "approved";
    if (status === "pending") return "pending";
    if (status === "rejected") return "rejected";
    return status || "pending";
};

const mapWithdrawal = (w) => ({
    id: w._id || w.id,
    user: w.userId ? (typeof w.userId === 'object' ? (w.userId.name || w.userId._id) : String(w.userId)) : "User",
    userId: typeof w.userId === 'object' ? w.userId._id : (w.userId || ""),
    amount: Number(w.finalAmount || w.grossAmount || 0),
    grossAmount: Number(w.grossAmount || 0),
    platformFee: Number(w.platformFee || 0),
    gst: Number(w.gst || 0),
    coins: Number(w.coins || 0),
    method: w.paymentMethod ? (w.paymentMethod.toUpperCase()) : "Wallet",
    paymentMethod: w.paymentMethod,
    bankDetails: w.bankDetails,
    upiId: w.upiId,
    kycDetails: w.kycDetails,
    documents: w.documents,
    status: mapStatus(w.status),
    date: w.createdAt || new Date().toISOString(),
    kycStatus: (w.kycDetails?.aadharNumber && w.documents?.aadharFrontUrl) ? "Verified" : "Pending",
    historyCount: 0
});

export const withdrawalService = {
    fetchWithdrawals: async (filter = "all") => {
        const query = filter && filter !== "all" ? `?status=${filter === "approved" ? "success" : filter}` : "";
        const data = await request(`/admin/withdrawals${query}`, { method: "GET" });
        const list = Array.isArray(data?.withdrawals) ? data.withdrawals : [];
        return list.map(mapWithdrawal);
    },

    approveWithdrawal: async (id) => {
        const data = await request("/admin/withdrawals/approve", {
            method: "POST",
            body: JSON.stringify({ withdrawalId: id })
        });
        return mapWithdrawal(data?.withdrawal || {});
    },

    rejectWithdrawal: async (id, reason) => {
        if (!reason) throw new Error("Rejection reason is mandatory.");
        const data = await request("/admin/withdrawals/reject", {
            method: "POST",
            body: JSON.stringify({ withdrawalId: id, reason })
        });
        return mapWithdrawal(data?.withdrawal || {});
    },

    fetchAuditLogs: async () => [],

    getUserFinancialSnapshot: async () => ({
        history: [],
        totalWithdrawn: 0
    }),

    fetchLedger: async () => []
};

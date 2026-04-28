const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

import { getStoredToken } from '../store/useUserStore';

const getToken = () => {
    const token = getStoredToken();
    console.log('[WalletService] Token retrieval:', token ? 'Found' : 'Missing');
    return token;
};

const request = async (path, options = {}) => {
    let response;
    const token = getToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };
    const fullUrl = `${API_BASE}${path}`;
    console.log(`[WalletService] Request: ${options.method || 'GET'} ${fullUrl}`);
    console.log(`[WalletService] Auth Token:`, token ? 'Present (Starts with ' + token.substring(0, 5) + '...)' : 'Missing');
    console.log(`[WalletService] Headers:`, JSON.stringify(headers));

    try {
        const { headers: extraHeaders, ...restOptions } = options;
        response = await fetch(`${API_BASE}${path}`, {
            headers: {
                ...headers,
                ...extraHeaders
            },
            ...restOptions
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

export const walletService = {
    getBalance: () => request("/wallet/balance", { method: "GET" }),
    getGifts: () => request("/wallet/gifts", { method: "GET" }),
    deposit: (amount, idempotencyKey) =>
        request("/wallet/deposit", {
            method: "POST",
            headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
            body: JSON.stringify({ amount })
        }),
    getTransactions: (params = {}) => {
        const search = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                search.set(key, value);
            }
        });
        const query = search.toString();
        return request(`/wallet/transactions${query ? `?${query}` : ""}`, { method: "GET" });
    },
    requestWithdrawal: (data) =>
        request("/wallet/withdraw", {
            method: "POST",
            headers: data.idempotencyKey ? { "Idempotency-Key": data.idempotencyKey } : {},
            body: JSON.stringify(data)
        }),
    initiateRecharge: (amount) =>
        request("/payment/recharge", {
            method: "POST",
            body: JSON.stringify({ amount })
        }),
    verifyPayment: (transactionId, razorpayData) =>
        request("/payment/verify", {
            method: "POST",
            body: JSON.stringify({ transactionId, ...razorpayData })
        }),
    sendGift: (giftId, receiverId, postId, reelId) =>
        request("/wallet/gift", {
            method: "POST",
            body: JSON.stringify({ giftId, receiverId, postId, reelId })
        })
};


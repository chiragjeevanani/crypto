const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("crypto_auth_token");

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

export const walletService = {
    getBalance: () => request("/wallet/balance", { method: "GET" }),
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
    requestWithdrawal: (coins, idempotencyKey) =>
        request("/wallet/withdraw", {
            method: "POST",
            headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
            body: JSON.stringify({ coins })
        })
};

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

const mapConfigToSettings = (config) => ({
    commission: Number(config?.platformFeePct || 0),
    minWithdrawal: Number(config?.minWithdrawalCoins || 0),
    coinRate: Number(config?.coinRate || 0),
    gstPct: Number(config?.gstPct || 0),
    referralLimit: Number(config?.referralLimit || 0)
});

export const settingsService = {
    fetchSettings: async () => {
        const data = await request("/admin/config", { method: "GET" });
        return mapConfigToSettings(data?.config);
    },

    updateSettings: async (newSettings) => {
        const payload = {};
        if (newSettings.commission !== undefined) payload.platformFeePct = Number(newSettings.commission);
        if (newSettings.minWithdrawal !== undefined) payload.minWithdrawalCoins = Number(newSettings.minWithdrawal);
        if (newSettings.coinRate !== undefined) payload.coinRate = Number(newSettings.coinRate);
        if (newSettings.gstPct !== undefined) payload.gstPct = Number(newSettings.gstPct);
        if (newSettings.referralLimit !== undefined) payload.referralLimit = Number(newSettings.referralLimit);

        const data = await request("/admin/config", {
            method: "PUT",
            body: JSON.stringify(payload)
        });
        return mapConfigToSettings(data?.config);
    },

    fetchSettingsLogs: async () => []
};

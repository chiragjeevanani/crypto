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

const mapConfigToSettings = (config) => ({
    platformFeePct: Number(config?.platformFeePct || 0),
    minWithdrawalCoins: Number(config?.minWithdrawalCoins || 0),
    coinRate: Number(config?.coinRate || 0),
    gstPct: Number(config?.gstPct || 0),
    minReferralsForWithdrawal: Number(config?.minReferralsForWithdrawal || 0),
    referralBonusCoins: Number(config?.referralBonusCoins || 0),
    premiumThreshold: Number(config?.premiumThreshold || 0),
    auctionListingFeeINR: Number(config?.auctionListingFeeINR || 0),
    auctionCommissionPct: Number(config?.auctionCommissionPct || 0),
    adminNotificationMobiles: config?.adminNotificationMobiles || ['', '', '', '']
});

export const settingsService = {
    fetchSettings: async () => {
        const data = await request("/admin/config", { method: "GET" });
        return mapConfigToSettings(data?.config);
    },

    updateSettings: async (newSettings) => {
        const payload = {};
        if (newSettings.platformFeePct !== undefined) payload.platformFeePct = Number(newSettings.platformFeePct);
        if (newSettings.minWithdrawalCoins !== undefined) payload.minWithdrawalCoins = Number(newSettings.minWithdrawalCoins);
        if (newSettings.coinRate !== undefined) payload.coinRate = Number(newSettings.coinRate);
        if (newSettings.gstPct !== undefined) payload.gstPct = Number(newSettings.gstPct);
        if (newSettings.minReferralsForWithdrawal !== undefined) payload.minReferralsForWithdrawal = Number(newSettings.minReferralsForWithdrawal);
        if (newSettings.referralBonusCoins !== undefined) payload.referralBonusCoins = Number(newSettings.referralBonusCoins);
        if (newSettings.premiumThreshold !== undefined) payload.premiumThreshold = Number(newSettings.premiumThreshold);
        if (newSettings.auctionListingFeeINR !== undefined) payload.auctionListingFeeINR = Number(newSettings.auctionListingFeeINR);
        if (newSettings.auctionCommissionPct !== undefined) payload.auctionCommissionPct = Number(newSettings.auctionCommissionPct);

        if (newSettings.adminNotificationMobiles !== undefined) {
            // Filter out empty strings to keep only valid numbers
            payload.adminNotificationMobiles = newSettings.adminNotificationMobiles.filter(m => m && m.trim() !== '');
        }

        const data = await request("/admin/config", {
            method: "PUT",
            body: JSON.stringify(payload)
        });
        return mapConfigToSettings(data?.config);
    },

    fetchSettingsLogs: async () => []
};

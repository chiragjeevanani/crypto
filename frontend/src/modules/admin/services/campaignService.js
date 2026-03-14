const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ADMIN_CAMPAIGNS = `${API_BASE}/admin/campaigns`;

const getAuthHeaders = () => {
    const raw = localStorage.getItem("crypto_auth_token");
    return raw ? { Authorization: `Bearer ${raw}` } : {};
};

const handle = async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Request failed");
    return data;
};

export const campaignService = {
    fetchCampaigns: async () => {
        const response = await fetch(ADMIN_CAMPAIGNS, { headers: getAuthHeaders() });
        const data = await handle(response);
        return data.campaigns || [];
    },

    fetchCampaignById: async (id) => {
        const response = await fetch(`${ADMIN_CAMPAIGNS}/${id}`, { headers: getAuthHeaders() });
        const data = await handle(response);
        return data.campaign;
    },

    createCampaign: async (data) => {
        const response = await fetch(ADMIN_CAMPAIGNS, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(data)
        });
        const res = await handle(response);
        return res.campaign;
    },

    updateStatus: async (id, status) => {
        const response = await fetch(`${ADMIN_CAMPAIGNS}/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({ status })
        });
        const res = await handle(response);
        return res.campaign;
    },

    updateCampaign: async (id, data) => {
        const response = await fetch(`${ADMIN_CAMPAIGNS}/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(data)
        });
        const res = await handle(response);
        return res.campaign;
    },

    deleteCampaign: async (id) => {
        const response = await fetch(`${ADMIN_CAMPAIGNS}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        return handle(response);
    },

    fetchSubmissions: async (id) => {
        const response = await fetch(`${ADMIN_CAMPAIGNS}/${id}/submissions`, {
            headers: getAuthHeaders()
        });
        const res = await handle(response);
        return res.submissions || [];
    },

    declareWinners: async (id) => {
        const response = await fetch(`${ADMIN_CAMPAIGNS}/${id}/declare-winners`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        const res = await handle(response);
        return res.winners || [];
    },

    markRewardDistributed: async (campaignId, submissionId) => {
        const response = await fetch(`${ADMIN_CAMPAIGNS}/${campaignId}/winners/${submissionId}/distribute`, {
            method: "PATCH",
            headers: getAuthHeaders()
        });
        const res = await handle(response);
        return res.submission;
    }
};

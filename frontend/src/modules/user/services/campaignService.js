const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const USER_CAMPAIGNS = `${API_BASE}/user/campaigns`;

const getAuthHeaders = () => {
    const raw = localStorage.getItem("crypto_auth_token");
    return raw ? { Authorization: `Bearer ${raw}` } : {};
};

const handle = async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Request failed");
    return data;
};

export const userCampaignService = {
    async listActive() {
        const response = await fetch(`${USER_CAMPAIGNS}?status=Active`, { headers: getAuthHeaders() });
        const data = await handle(response);
        return data.campaigns || [];
    },

    async getById(id, track = false) {
        const response = await fetch(`${USER_CAMPAIGNS}/${id}${track ? '?track=1' : ''}`, { headers: getAuthHeaders() });
        const data = await handle(response);
        return data.campaign;
    },

    async join(id) {
        const response = await fetch(`${USER_CAMPAIGNS}/${id}/join`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        return handle(response);
    },

    async submit(id, body) {
        let fetchOptions = {
            method: "POST",
            headers: getAuthHeaders()
        };

        if (body instanceof FormData) {
            fetchOptions.body = body;
            // No need to set Content-Type, fetch does it for FormData
        } else {
            fetchOptions.headers["Content-Type"] = "application/json";
            fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(`${USER_CAMPAIGNS}/${id}/submissions`, { ...fetchOptions });
        return handle(response);
    },

    async listSubmissions(id) {
        const response = await fetch(`${USER_CAMPAIGNS}/${id}/submissions`, { headers: getAuthHeaders() });
        const data = await handle(response);
        return data.submissions || [];
    },

    async vote(id, submissionId) {
        const response = await fetch(`${USER_CAMPAIGNS}/${id}/submissions/${submissionId}/vote`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        return handle(response);
    }
};

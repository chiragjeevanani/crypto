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

    async submit(id, { file, caption, mediaUrl, mediaType }) {
        if (file) {
            const formData = new FormData();
            formData.append("media", file);
            if (caption) formData.append("caption", caption);
            const response = await fetch(`${USER_CAMPAIGNS}/${id}/submissions`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: formData
            });
            return handle(response);
        }

        const response = await fetch(`${USER_CAMPAIGNS}/${id}/submissions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({ caption, mediaUrl, mediaType })
        });
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

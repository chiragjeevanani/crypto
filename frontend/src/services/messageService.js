import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('crypto_auth_token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const messageService = {
    getConversations: async () => {
        const response = await axios.get(`${API_URL}/user/messages/conversations`, getAuthHeader());
        return response.data.conversations;
    },
    getMessages: async (roomId) => {
        const response = await axios.get(`${API_URL}/user/messages/messages/${roomId}`, getAuthHeader());
        return response.data.messages;
    },
    uploadMedia: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const config = getAuthHeader();
        config.headers['Content-Type'] = 'multipart/form-data';
        const response = await axios.post(`${API_URL}/user/messages/upload`, formData, config);
        return response.data;
    },
    getUnreadTotal: async () => {
        const response = await axios.get(`${API_URL}/user/messages/unread-total`, getAuthHeader());
        return response.data.total;
    }
};

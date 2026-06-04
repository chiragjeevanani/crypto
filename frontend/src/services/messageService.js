import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

import { getStoredToken } from '../modules/user/store/useUserStore';

const getAuthHeader = () => {
    const token = getStoredToken();
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
    },
    deleteMessage: async (messageId) => {
        const response = await axios.delete(`${API_URL}/user/messages/messages/${messageId}`, getAuthHeader());
        return response.data;
    },
    editMessage: async (messageId, text) => {
        const response = await axios.put(`${API_URL}/user/messages/messages/${messageId}`, { text }, getAuthHeader());
        return response.data;
    },
    deleteChat: async (roomId) => {
        const response = await axios.delete(`${API_URL}/user/messages/conversations/${roomId}`, getAuthHeader());
        return response.data;
    },
    createGroup: async (name, members) => {
        const response = await axios.post(`${API_URL}/user/messages/group`, { name, members }, getAuthHeader());
        return response.data;
    },
    getGroups: async () => {
        const response = await axios.get(`${API_URL}/user/messages/groups`, getAuthHeader());
        return response.data.groups;
    },
    addGroupMembers: async (groupId, members) => {
        const response = await axios.post(`${API_URL}/user/messages/group/${groupId}/add`, { members }, getAuthHeader());
        return response.data;
    },
    removeGroupMember: async (groupId, memberId) => {
        const response = await axios.post(`${API_URL}/user/messages/group/${groupId}/remove`, { memberId }, getAuthHeader());
        return response.data;
    },
    leaveGroup: async (groupId) => {
        const response = await axios.post(`${API_URL}/user/messages/group/${groupId}/leave`, {}, getAuthHeader());
        return response.data;
    },
    getGroupDetails: async (groupId) => {
        const response = await axios.get(`${API_URL}/user/messages/group/${groupId}`, getAuthHeader());
        return response.data.group;
    },
    updateGroup: async (groupId, name, avatar) => {
        const response = await axios.put(`${API_URL}/user/messages/group/${groupId}`, { name, avatar }, getAuthHeader());
        return response.data.group;
    }
};

import axios from 'axios';
import { getStoredToken } from '../../user/store/useUserStore';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auctions`;

const getAuthHeader = () => {
    const token = getStoredToken();
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const auctionService = {
    getAuctions: async (status = '', creatorId = '') => {
        const response = await axios.get(`${API_URL}?status=${status}&creatorId=${creatorId}`);
        return response.data;
    },

    getAuctionDetail: async (id) => {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    },

    initiateListingFee: async () => {
        const response = await axios.post(`${API_URL}/initiate-listing-fee`, {}, getAuthHeader());
        return response.data;
    },

    createAuction: async (data) => {
        const response = await axios.post(API_URL, data, getAuthHeader());
        return response.data;
    },

    placeBid: async (id, amount) => {
        const response = await axios.post(`${API_URL}/${id}/bid`, { amount }, getAuthHeader());
        return response.data;
    },

    updateStatus: async (id, status) => {
        const response = await axios.patch(`${API_URL}/${id}/status`, { status }, getAuthHeader());
        return response.data;
    }
};

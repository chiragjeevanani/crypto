import { getStoredToken } from '../../user/store/useUserStore';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

export const dashboardService = {
    fetchStats: async () => {
        const response = await fetch(`${API_URL}/admin/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${getStoredToken()}`
            }
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },

    fetchFinancials: async () => {
        const response = await fetch(`${API_URL}/admin/dashboard/financials`, {
            headers: {
                'Authorization': `Bearer ${getStoredToken()}`
            }
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },

    fetchTransactions: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_URL}/admin/dashboard/transactions?${query}`, {
            headers: {
                'Authorization': `Bearer ${getStoredToken()}`
            }
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },

    fetchExchangeRates: async (base = 'USD') => {
        const response = await fetch(`${API_URL}/admin/dashboard/exchange-rates?base=${base}`, {
            headers: {
                'Authorization': `Bearer ${getStoredToken()}`
            }
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    }
};


import { getAdminCampaignsFromStorage, syncAdminCampaignsFromService } from '../../../shared/adminCampaignSync';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let mockCampaigns = getAdminCampaignsFromStorage();

export const campaignService = {
    fetchCampaigns: async () => {
        await delay(1000);
        mockCampaigns = getAdminCampaignsFromStorage();
        return [...mockCampaigns];
    },

    createCampaign: async (data) => {
        await delay(1500);
        const newCampaign = {
            ...data,
            id: `C-${Math.floor(Math.random() * 900) + 100}`,
            participants: 0,
            progress: 0,
            color: 'primary'
        };
        mockCampaigns.push(newCampaign);
        mockCampaigns = syncAdminCampaignsFromService(mockCampaigns);
        return newCampaign;
    },

    updateStatus: async (id, status) => {
        await delay(800);
        const campaign = mockCampaigns.find(c => c.id === id);
        if (campaign) {
            campaign.status = status;
        }
        mockCampaigns = syncAdminCampaignsFromService(mockCampaigns);
        return campaign;
    },

    updateCampaign: async (id, data) => {
        await delay(1000);
        mockCampaigns = mockCampaigns.map(c => c.id === id ? { ...c, ...data } : c);
        mockCampaigns = syncAdminCampaignsFromService(mockCampaigns);
        return mockCampaigns.find(c => c.id === id);
    },

    distributePrizes: async (id) => {
        await delay(2000);
        const campaign = mockCampaigns.find(c => c.id === id);
        if (campaign) {
            campaign.status = 'Completed';
            campaign.progress = 100;
        }
        mockCampaigns = syncAdminCampaignsFromService(mockCampaigns);
        return campaign;
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let mockCampaigns = [
    {
        id: 'C-101',
        title: 'Summer Splash Brand Task',
        brand: 'Pepsi Co',
        budget: 5000,
        participants: 1240,
        status: 'Active',
        endDate: '2026-09-12',
        progress: 65,
        color: 'emerald-500'
    },
    {
        id: 'C-102',
        title: 'Eco-Friendly Challenge',
        brand: 'Green Earth',
        budget: 2500,
        participants: 850,
        status: 'Paused',
        endDate: '2026-10-05',
        progress: 30,
        color: 'amber-500'
    },
    {
        id: 'C-103',
        title: 'New App Review Blast',
        brand: 'TechVibe',
        budget: 10000,
        participants: 4500,
        status: 'Active',
        endDate: '2026-08-28',
        progress: 92,
        color: 'primary'
    }
];

export const campaignService = {
    fetchCampaigns: async () => {
        await delay(1000);
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
        return newCampaign;
    },

    updateStatus: async (id, status) => {
        await delay(800);
        const campaign = mockCampaigns.find(c => c.id === id);
        if (campaign) {
            campaign.status = status;
        }
        return campaign;
    },

    updateCampaign: async (id, data) => {
        await delay(1000);
        mockCampaigns = mockCampaigns.map(c => c.id === id ? { ...c, ...data } : c);
        return mockCampaigns.find(c => c.id === id);
    },

    distributePrizes: async (id) => {
        await delay(2000);
        const campaign = mockCampaigns.find(c => c.id === id);
        if (campaign) {
            campaign.status = 'Completed';
            campaign.progress = 100;
        }
        return campaign;
    }
};

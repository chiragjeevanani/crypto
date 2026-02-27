const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let mockUsers = [
    {
        id: 'U-7721',
        name: 'CryptoWhale_88',
        email: 'whale@crypto.com',
        role: 'VIP User',
        status: 'Verified',
        kycVerified: true,
        riskScore: 'Low',
        joined: 'Jan 12, 2024',
        walletBalance: 1240.50,
        totalEarnings: 4500.00,
        campaigns: 12,
        isBanned: false,
        isSuspicious: false,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
    },
    {
        id: 'U-7722',
        name: 'BotHunter_X',
        email: 'bh@gmail.com',
        role: 'Standard',
        status: 'Flagged',
        kycVerified: false,
        riskScore: 'High',
        joined: 'Feb 05, 2024',
        walletBalance: 45.00,
        totalEarnings: 120.00,
        campaigns: 2,
        isBanned: false,
        isSuspicious: true,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    },
    {
        id: 'U-7723',
        name: 'MemeMaster',
        email: 'meme@xyz.com',
        role: 'Standard',
        status: 'Pending',
        kycVerified: false,
        riskScore: 'Medium',
        joined: 'Feb 20, 2024',
        walletBalance: 210.00,
        totalEarnings: 840.00,
        campaigns: 5,
        isBanned: false,
        isSuspicious: false,
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop'
    }
];

export const userService = {
    fetchUsers: async (params = {}) => {
        await delay(900);
        const { search = '', role = 'all', status = 'all', kyc = 'all', page = 1, limit = 10 } = params;

        let filtered = mockUsers.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase()) ||
                u.id.toLowerCase().includes(search.toLowerCase());
            const matchesRole = role === 'all' || u.role === role;
            const matchesStatus = status === 'all' || u.status === status || (status === 'Banned' && u.isBanned);
            const matchesKYC = kyc === 'all' || (kyc === 'verified' && u.kycVerified) || (kyc === 'pending' && !u.kycVerified);

            return matchesSearch && matchesRole && matchesStatus && matchesKYC;
        });

        const total = filtered.length;
        const start = (page - 1) * limit;
        const paginated = filtered.slice(start, start + limit);

        return {
            users: paginated,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    },

    fetchUserDetail: async (id) => {
        await delay(800);
        const user = mockUsers.find(u => u.id === id);
        if (!user) throw new Error("Identity node not found.");

        return {
            ...user,
            giftHistory: [
                { id: 'G-1', sender: 'Anonymous', gift: 'Rose', value: 10, date: '2024-02-25' },
                { id: 'G-2', sender: 'WhaleAlpha', gift: 'Diamond', value: 1000, date: '2024-02-21' }
            ],
            votingHistory: [
                { id: 'V-101', poll: 'Sept. Ambassador', choice: 'Option A', date: '2024-02-20' },
                { id: 'V-102', poll: 'UI Colors', choice: 'Dark Mode', date: '2024-02-15' }
            ],
            campaignParticipation: [
                { id: 'C-55', title: 'Summer Splash', reward: 50, status: 'Claimed', date: '2024-02-10' },
                { id: 'C-58', title: 'New App Blast', reward: 100, status: 'Pending', date: '2024-02-26' }
            ]
        };
    },

    toggleBan: async (id) => {
        await delay(1000);
        const user = mockUsers.find(u => u.id === id);
        if (user) {
            user.isBanned = !user.isBanned;
        }
        return user ? { ...user } : null;
    },

    markSuspicious: async (id) => {
        await delay(500);
        const user = mockUsers.find(u => u.id === id);
        if (user) {
            user.isSuspicious = !user.isSuspicious;
        }
        return user ? { ...user } : null;
    },

    verifyKYC: async (id) => {
        await delay(1200);
        const user = mockUsers.find(u => u.id === id);
        if (user) {
            user.status = 'Verified';
            user.kycVerified = true;
        }
        return user ? { ...user } : null;
    },

    updateUser: async (id, userData) => {
        await delay(1000);
        mockUsers = mockUsers.map(u => u.id === id ? { ...u, ...userData } : u);
        return mockUsers.find(u => u.id === id);
    },

    fetchSuspiciousUsers: async () => {
        await delay(1100);
        return mockUsers.filter(u => u.riskScore === 'High' || u.isSuspicious).map(u => ({ ...u }));
    }
};

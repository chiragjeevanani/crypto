const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
import { getKYCSubmissionByUser, getKYCSubmissions, patchKYCSubmission } from '../../../shared/kycSync'

let mockUsers = [
    {
        id: 'U-7721',
        name: 'CryptoWhale_88',
        email: 'whale@crypto.com',
        role: 'VIP User',
        status: 'Verified',
        kycStatus: 'approved',
        kycVerified: true,
        riskScore: 'Low',
        joined: 'Jan 12, 2024',
        walletBalance: 1240.50,
        totalEarnings: 4500.00,
        campaigns: 12,
        isBanned: false,
        isSuspicious: false,
        referralCode: 'WHALE88',
        referredCount: 7,
        aadharFront: 'https://dummyimage.com/600x380/e5e7eb/111827&text=Aadhaar+Front+U-7721',
        aadharBack: 'https://dummyimage.com/600x380/e5e7eb/111827&text=Aadhaar+Back+U-7721',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
    },
    {
        id: 'U-7722',
        name: 'BotHunter_X',
        email: 'bh@gmail.com',
        role: 'Standard',
        status: 'Flagged',
        kycStatus: 'pending',
        kycVerified: false,
        riskScore: 'High',
        joined: 'Feb 05, 2024',
        walletBalance: 45.00,
        totalEarnings: 120.00,
        campaigns: 2,
        isBanned: false,
        isSuspicious: true,
        referralCode: 'BOTX22',
        referredCount: 2,
        aadharFront: 'https://dummyimage.com/600x380/e5e7eb/111827&text=Aadhaar+Front+U-7722',
        aadharBack: 'https://dummyimage.com/600x380/e5e7eb/111827&text=Aadhaar+Back+U-7722',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    },
    {
        id: 'U-7723',
        name: 'MemeMaster',
        email: 'meme@xyz.com',
        role: 'Standard',
        status: 'Pending',
        kycStatus: 'pending',
        kycVerified: false,
        riskScore: 'Medium',
        joined: 'Feb 20, 2024',
        walletBalance: 210.00,
        totalEarnings: 840.00,
        campaigns: 5,
        isBanned: false,
        isSuspicious: false,
        referralCode: 'MEME23',
        referredCount: 4,
        aadharFront: 'https://dummyimage.com/600x380/e5e7eb/111827&text=Aadhaar+Front+U-7723',
        aadharBack: 'https://dummyimage.com/600x380/e5e7eb/111827&text=Aadhaar+Back+U-7723',
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
            referralCode: user.referralCode,
            referredCount: user.referredCount || 0,
            aadharFront: user.aadharFront,
            aadharBack: user.aadharBack,
            kycStatus: user.kycStatus || (user.kycVerified ? 'approved' : 'pending'),
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
            if ((user.referredCount || 0) < 5) {
                throw new Error('KYC cannot be approved until at least 5 users join with this referral code.');
            }
            user.status = 'Verified';
            user.kycVerified = true;
            user.kycStatus = 'approved';
            return { ...user };
        }
        const synced = getKYCSubmissionByUser(id)
        if (!synced) return null
        if ((synced.referredCount || 0) < (synced.requiredReferrals || 5)) {
            throw new Error('KYC cannot be approved until at least 5 users join with this referral code.');
        }
        const updated = patchKYCSubmission(id, { status: 'approved', payoutsUnlocked: true })
        return updated ? { ...updated } : null
    },

    incrementReferral: async (id) => {
        await delay(500);
        const user = mockUsers.find(u => u.id === id);
        if (user) {
            user.referredCount = Math.min(25, (user.referredCount || 0) + 1);
            return { ...user };
        }
        const synced = getKYCSubmissionByUser(id)
        if (!synced) return null
        const required = synced.requiredReferrals || 5
        const nextCount = Math.min(100, (synced.referredCount || 0) + 1)
        const updated = patchKYCSubmission(id, {
            referredCount: nextCount,
            status: nextCount >= required ? 'pending' : synced.status,
        })
        return updated ? { ...updated } : null
    },

    fetchKYCQueue: async () => {
        await delay(700);
        const mockQueue = mockUsers
            .filter((u) => !u.kycVerified)
            .map((u, idx) => ({
                id: `KYC-${2000 + idx}`,
                userId: u.id,
                user: u.name,
                docType: 'Aadhaar Front + Aadhaar Back',
                status: u.kycStatus === 'rejected' ? 'rejected' : 'pending',
                submittedAt: '2026-02-27',
                referralCode: u.referralCode || '-',
                referredCount: u.referredCount || 0,
                requiredReferrals: 5,
                eligibleByReferral: (u.referredCount || 0) >= 5,
                aadharFront: u.aadharFront,
                aadharBack: u.aadharBack,
            }));
        const syncedQueue = getKYCSubmissions()
            .filter((entry) => entry.status !== 'approved')
            .map((entry, idx) => ({
                id: `KYC-EXT-${3000 + idx}`,
                userId: entry.userId,
                user: entry.user || 'User',
                docType: 'Aadhaar Front + Aadhaar Back',
                status: entry.status || 'pending',
                submittedAt: entry.submittedAt || '2026-02-28',
                referralCode: entry.referralCode || '-',
                referredCount: entry.referredCount || 0,
                requiredReferrals: entry.requiredReferrals || 5,
                eligibleByReferral: (entry.referredCount || 0) >= (entry.requiredReferrals || 5),
                aadharFront: entry.aadharFront || '#',
                aadharBack: entry.aadharBack || '#',
            }))
        return [...syncedQueue, ...mockQueue]
    },

    updateUser: async (id, userData) => {
        await delay(1000);
        mockUsers = mockUsers.map(u => u.id === id ? { ...u, ...userData } : u);
        return mockUsers.find(u => u.id === id);
    },

    deleteUser: async (id) => {
        await delay(900);
        const existing = mockUsers.find((u) => u.id === id);
        if (!existing) return null;
        mockUsers = mockUsers.filter((u) => u.id !== id);
        return { ...existing };
    },

    fetchSuspiciousUsers: async () => {
        await delay(1100);
        return mockUsers.filter(u => u.riskScore === 'High' || u.isSuspicious).map(u => ({ ...u }));
    }
};

import { create } from 'zustand';
import { giftService } from '../services/giftService';
import { withdrawalService } from '../services/withdrawalService';
import { userService } from '../services/userService';
import { campaignService } from '../services/campaignService';
import { moderationService } from '../services/moderationService';
import { settingsService } from '../services/settingsService';
import { reportService } from '../services/reportService';
import { financialService } from '../services/financialService';
import { dashboardService } from '../services/dashboardService';
import { useCampaignStore } from '../../user/store/useCampaignStore';
import { notificationService } from '../services/notificationService';
import { authService } from '../../auth/services/authService';

import { patchKYCSubmission } from '../../../shared/kycSync';
import { syncGiftCatalogFromAdminGifts } from '../../../shared/giftCatalog';
import { savePlatformSettingsToCookie } from '../../../shared/platformSettings';
import { getStoredToken } from '../../user/store/useUserStore';

export const useAdminStore = create((set, get) => ({
    // States
    gifts: [],
    trashGifts: [],
    withdrawals: [],
    users: [],
    usersData: { users: [], total: 0, page: 1, totalPages: 1 },
    userDetail: null,
    campaigns: [],
    posts: [],
    postDetail: null,
    ledger: [],
    auditLogs: [],
    deposits: [],
    giftHistory: [],
    suspiciousUsers: [],
    selectedChat: null,
    settings: null,
    categories: [],
    reports: [],
    countries: [],
    states: [],
    moderationStats: { ads: 0, nfts: 0, reports: 0, withdrawals: 0, kycs: 0 },
    prdMetrics: null,
    dashboardStats: null,
    exchangeRates: null,
    giftPolicy: {

        allowedINR: [2, 3, 4, 5, 6, 7, 8, 9, 10],
        strictMode: true,
    },
    kycQueue: [],

    settlementRails: [
        { id: 'rail_upi', name: 'UPI', status: 'active', reconciled: 42, pending: 3, lastRun: '5 mins ago' },
        { id: 'rail_bank', name: 'Bank Transfer', status: 'degraded', reconciled: 20, pending: 5, lastRun: '17 mins ago' },
        { id: 'rail_crypto', name: 'Crypto Payout', status: 'active', reconciled: 15, pending: 1, lastRun: '2 mins ago' },
    ],
    campaignClosures: [],
    adminNotifications: [],
    unreadAdminNotificationsCount: 0,
    dashboardSearchQuery: '',
    setDashboardSearchQuery: (q) => set({ dashboardSearchQuery: q }),

    // UI States
    isLoading: false,
    error: null,
    lastSharedAction: null, // For notifications/toasts

    // Helper for loading/error wrapping
    execute: async (action, successMessage) => {
        set({ isLoading: true, error: null });
        try {
            const result = await action();
            if (successMessage) {
                const message = typeof successMessage === 'function' ? successMessage(result) : successMessage;
                set({ lastSharedAction: { type: 'success', message, timestamp: Date.now() } });
            }
            return result;
        } catch (err) {
            set({ error: err.message, lastSharedAction: { type: 'error', message: err.message, timestamp: Date.now() } });
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    // Actions - Gifts
    loadGifts: () => get().execute(async () => {
        const gifts = await giftService.fetchGifts();
        set({ gifts });
        syncGiftCatalogFromAdminGifts(gifts);
    }),

    loadTrashGifts: () => get().execute(async () => {
        const trashGifts = await giftService.fetchTrashGifts();
        set({ trashGifts });
    }),

    addGift: (data) => get().execute(async () => {
        const newGift = await giftService.createGift(data);
        set((state) => {
            const nextGifts = [...state.gifts, newGift];
            syncGiftCatalogFromAdminGifts(nextGifts);
            return { gifts: nextGifts };
        });
    }, "Gift created successfully."),

    updateGift: (id, data) => get().execute(async () => {
        const updated = await giftService.updateGift(id, data);
        set((state) => ({
            gifts: state.gifts.map(g => g.id === id ? updated : g)
        }));
        syncGiftCatalogFromAdminGifts(get().gifts);
    }, "Gift configuration updated."),

    removeGift: (id) => get().execute(async () => {
        await giftService.deleteGift(id);
        const [gifts, trash] = await Promise.all([giftService.fetchGifts(), giftService.fetchTrashGifts()]);
        set({ gifts, trashGifts: trash });
        syncGiftCatalogFromAdminGifts(gifts);
    }, "Gift moved to trash."),

    restoreGift: (id) => get().execute(async () => {
        await giftService.restoreGift(id);
        const [gifts, trash] = await Promise.all([giftService.fetchGifts(), giftService.fetchTrashGifts()]);
        set({ gifts, trashGifts: trash });
        syncGiftCatalogFromAdminGifts(gifts);
    }, "Gift restored to registry."),

    permanentlyDeleteGift: (id) => get().execute(async () => {
        await giftService.permanentlyDeleteGift(id);
        set((state) => ({
            trashGifts: state.trashGifts.filter(g => g.id !== id)
        }));
    }, "Gift permanently erased from node."),

    toggleGiftStatus: (id) => get().execute(async () => {
        const updated = await giftService.toggleStatus(id);
        set((state) => ({
            gifts: state.gifts.map(g => g.id === id ? updated : g)
        }));
        syncGiftCatalogFromAdminGifts(get().gifts);
    }),

    // Actions - Withdrawals
    loadWithdrawals: (filter) => get().execute(async () => {
        const withdrawals = await withdrawalService.fetchWithdrawals(filter);
        set({ withdrawals });
    }),

    loadLedger: () => get().execute(async () => {
        const ledger = await withdrawalService.fetchLedger();
        set({ ledger });
    }),

    loadAuditLogs: () => get().execute(async () => {
        const logs = await withdrawalService.fetchAuditLogs();
        set({ auditLogs: logs });
    }),

    approveWithdrawal: (id) => get().execute(async () => {
        const updated = await withdrawalService.approveWithdrawal(id);
        set((state) => ({
            withdrawals: state.withdrawals.map(w => w.id === id ? updated : w)
        }));
        const [ledger, logs, stats] = await Promise.all([
            withdrawalService.fetchLedger(),
            withdrawalService.fetchAuditLogs(),
            dashboardService.fetchFinancials()
        ]);
        set({ ledger, auditLogs: logs, financialStats: stats });
    }, "Withdrawal request approved and processed."),

    rejectWithdrawal: (id, reason) => get().execute(async () => {
        const updated = await withdrawalService.rejectWithdrawal(id, reason);
        set((state) => ({
            withdrawals: state.withdrawals.map(w => w.id === id ? updated : w)
        }));
        const [logs, stats] = await Promise.all([
            withdrawalService.fetchAuditLogs(),
            dashboardService.fetchFinancials()
        ]);
        set({ auditLogs: logs, financialStats: stats });
    }, "Withdrawal request rejected."),

    getUserFinancialSnapshot: (userId) => get().execute(async () => {
        return await withdrawalService.getUserFinancialSnapshot(userId);
    }),

    // Actions - Financial Transactions
    loadDeposits: (params) => get().execute(async () => {
        const deposits = await financialService.fetchDeposits(params);
        set({ deposits });
    }),

    loadGiftHistory: (params) => get().execute(async () => {
        const giftHistory = await financialService.fetchGiftHistory(params);
        set({ giftHistory });
    }),

    // Actions - Users
    loadUsers: (params) => get().execute(async () => {
        const data = await userService.fetchUsers(params);
        set({ usersData: data, users: data.users });
    }),

    loadUserDetail: (id) => get().execute(async () => {
        const detail = await userService.fetchUserDetail(id);
        set({ userDetail: detail });
    }),

    toggleUserBan: (id) => get().execute(async () => {
        const updated = await userService.toggleBan(id);
        set((state) => ({
            users: state.users.map(u => u.id === id ? updated : u),
            usersData: { ...state.usersData, users: state.usersData.users.map(u => u.id === id ? updated : u) }
        }));
    }, (res) => res?.isBanned ? "User restricted from platform." : "User access restored."),

    markUserSuspicious: (id) => get().execute(async () => {
        const updated = await userService.markSuspicious(id);
        set((state) => ({
            users: state.users.map(u => u.id === id ? updated : u),
            usersData: { ...state.usersData, users: state.usersData.users.map(u => u.id === id ? updated : u) }
        }));
    }, "Identity flagged for forensic monitoring."),

    deleteUser: (id) => get().execute(async () => {
        const removed = await userService.deleteUser(id);
        if (!removed) return;
        const nextUsers = get().users.filter((u) => u.id !== id);
        const nextUsersDataUsers = get().usersData.users.filter((u) => u.id !== id);
        const nextTotal = Math.max(0, (get().usersData.total || 0) - 1);
        set((state) => ({
            users: nextUsers,
            usersData: {
                ...state.usersData,
                users: nextUsersDataUsers,
                total: nextTotal,
                totalPages: Math.max(1, state.usersData.totalPages || 1),
            },
            userDetail: state.userDetail?.id === id ? null : state.userDetail,
        }));
    }, "User removed from platform registry."),

    verifyUserKYC: (id) => get().execute(async () => {
        const updated = await userService.verifyKYC(id);
        set((state) => ({
            users: state.users.map(u => u.id === id ? updated : u),
            usersData: { ...state.usersData, users: state.usersData.users.map(u => u.id === id ? updated : u) }
        }));
    }, "Identity verified successfully."),

    loadSuspiciousUsers: () => get().execute(async () => {
        const suspiciousUsers = await userService.fetchSuspiciousUsers();
        set({ suspiciousUsers });
    }),

    // Actions - Campaigns
    loadCampaigns: () => get().execute(async () => {
        const campaigns = await campaignService.fetchCampaigns();
        const closures = campaigns
            .filter((campaign) => campaign.status === 'Completed')
            .map((campaign) => ({
                id: campaign._id || campaign.id,
                title: campaign.title,
                winner: (campaign.winners && campaign.winners.length) ? 'Winner selected' : 'TBD',
                payout: campaign.rewardDetails || '—',
                auditLinked: false,
            }));
        set({ campaigns, campaignClosures: closures });
    }),

    createCampaign: (data) => get().execute(async () => {
        const created = await campaignService.createCampaign({
            ...data,
            status: data?.status || 'Active',
        });
        set((state) => ({ campaigns: [...state.campaigns, created] }));
        return created;
    }, "Campaign created."),

    setCampaignStatus: (id, status) => get().execute(async () => {
        const updated = await campaignService.updateStatus(id, status);
        set((state) => ({
            campaigns: state.campaigns.map(c => (c._id || c.id) === id ? updated : c)
        }));
    }, `Campaign shifted to ${status}.`),

    updateCampaign: (id, data) => get().execute(async () => {
        const updated = await campaignService.updateCampaign(id, data);
        set((state) => ({
            campaigns: state.campaigns.map(c => (c._id || c.id) === id ? updated : c)
        }));
        return updated;
    }, "Campaign updated."),

    deleteCampaign: (id) => get().execute(async () => {
        await campaignService.deleteCampaign(id);
        set((state) => ({
            campaigns: state.campaigns.filter(c => (c._id || c.id) !== id)
        }));
    }, "Campaign deleted."),

    loadCampaignSubmissions: (id) => get().execute(async () => {
        return await campaignService.fetchSubmissions(id);
    }),

    verifyCampaignSubmission: (campaignId, submissionId, isVerified) => get().execute(async () => {
        const updated = await campaignService.verifySubmission(campaignId, submissionId, isVerified);
        return updated;
    }, isVerified ? "Submission verified." : "Submission marked as unverified."),

    // Actions - Moderation
    loadPosts: (params) => get().execute(async () => {
        const posts = await moderationService.fetchPosts(params);
        set({ posts });
    }),

    loadAdvertiserPosts: (status) => get().execute(async () => {
        const posts = await moderationService.fetchPosts({ isBusiness: true, status });
        set({ posts });
    }),

    loadModerationStats: () => get().execute(async () => {
        const stats = await moderationService.fetchStats();
        set({ moderationStats: stats });
    }),

    acknowledgeAds: () => get().execute(async () => {
        await moderationService.acknowledgeAds();
        get().loadModerationStats();
    }),

    // Actions - Reports
    loadReports: () => get().execute(async () => {
        const reports = await reportService.fetchReports();
        set({ reports });
    }),

    handleReportAction: (id, action) => get().execute(async () => {
        const data = await reportService.handleAction(id, action);
        if (data.success) {
            set(state => ({
                reports: state.reports.map(r => r.id === id ? { ...r, status: action === 'ignore' ? 'ignored' : 'resolved', actionTaken: action } : r)
            }));
            if (action === 'delete') get().loadPosts(); // Refresh posts if one was "deleted"
        }
        return data;
    }, (res) => `Report ${action}d successfully.`),

    // Actions - Categories
    loadCategories: () => get().execute(async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5002/api"}/admin/categories`);
        const data = await res.json();
        if (data.success) {
            set({ categories: data.categories });
        }
    }),

    addCategory: (formData) => get().execute(async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5002/api"}/admin/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getStoredToken()}`
            },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
            set(state => ({ categories: [...state.categories, data.category] }));
            return data.category;
        }
        throw new Error(data.message || "Failed to add category");
    }, "Category created."),

    updateCategory: (id, formData) => get().execute(async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5002/api"}/admin/categories/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getStoredToken()}`
            },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
            set(state => ({
                categories: state.categories.map(c => c._id === id ? data.category : c)
            }));
            return data.category;
        }
        throw new Error(data.message || "Failed to update category");
    }, "Category updated."),

    deleteCategory: (id) => get().execute(async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5002/api"}/admin/categories/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getStoredToken()}`
            }
        });
        const data = await res.json();
        if (data.success) {
            set(state => ({ categories: state.categories.filter(c => c._id !== id) }));
        }
    }, "Category removed."),

    addSubcategory: (categoryId, formData) => get().execute(async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5002/api"}/admin/categories/${categoryId}/sub`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getStoredToken()}`
            },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
            set(state => ({
                categories: state.categories.map(c => c._id === categoryId ? data.category : c)
            }));
            return data.category;
        }
        throw new Error(data.message || "Failed to add subcategory");
    }, "Subcategory added."),

    updateSubcategory: (categoryId, subId, formData) => get().execute(async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5002/api"}/admin/categories/${categoryId}/sub/${subId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getStoredToken()}`
            },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
            set(state => ({
                categories: state.categories.map(c => c._id === categoryId ? data.category : c)
            }));
            return data.category;
        }
        throw new Error(data.message || "Failed to update subcategory");
    }, "Subcategory updated."),

    deleteSubcategory: (categoryId, subId) => get().execute(async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5002/api"}/admin/categories/${categoryId}/sub/${subId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getStoredToken()}`
            }
        });
        const data = await res.json();
        if (data.success) {
            set(state => ({
                categories: state.categories.map(c => c._id === categoryId ? data.category : c)
            }));
        }
    }, "Subcategory removed."),

    // Actions - Locations
    loadCountries: () => get().execute(async () => {
        const data = await authService.getCountries();
        if (data.success) {
            set({ countries: data.countries });
        }
    }),

    loadStates: (code) => get().execute(async () => {
        const data = await authService.getStates(code);
        if (data.success) {
            set({ states: data.states });
        }
    }),

    saveCountry: (formData) => get().execute(async () => {
        const token = getStoredToken();
        const data = await authService.saveCountry(token, formData);
        if (data.success) {
            set(state => ({
                countries: state.countries.find(c => c.code === data.country.code)
                    ? state.countries.map(c => c.code === data.country.code ? data.country : c)
                    : [...state.countries, data.country]
            }));
            return data.country;
        }
    }, "Country data synchronized."),

    deleteCountry: (code) => get().execute(async () => {
        const token = getStoredToken();
        const data = await authService.deleteCountry(token, code);
        if (data.success) {
            set(state => ({ countries: state.countries.filter(c => c.code !== code) }));
        }
    }, "Country removed from protocol."),

    addState: (formData) => get().execute(async () => {
        const token = getStoredToken();
        const data = await authService.addState(token, formData);
        if (data.success) {
            set(state => ({ states: [...state.states, data.state] }));
            get().loadCountries(); // Refresh state counts
            return data.state;
        }
    }, "State node added."),

    deleteState: (id) => get().execute(async () => {
        const token = getStoredToken();
        const data = await authService.deleteState(token, id);
        if (data.success) {
            set(state => ({ states: state.states.filter(s => s._id !== id) }));
            get().loadCountries(); // Refresh state counts
        }
    }, "State node removed."),

    loadPostDetail: (id) => get().execute(async () => {
        const postDetail = await moderationService.fetchPostDetail(id);
        set({ postDetail });
    }),

    handlePostApproval: (id, approve) => get().execute(async () => {
        let updated;
        if (approve) {
            updated = await moderationService.approvePost(id);
        } else {
            updated = await moderationService.rejectPost(id, "Content policy violation");
        }
        set((state) => ({
            posts: state.posts.map(p => p.id === id ? updated : p),
            postDetail: state.postDetail?.id === id ? { ...state.postDetail, ...updated } : state.postDetail,
        }));
    }, approve ? "Post approved for broadcast." : "Post restricted."),

    // Actions - Settings
    loadSettings: () => get().execute(async () => {
        const settings = await settingsService.fetchSettings();
        set({ settings });
        // Sync to public shared cookie for the user app
        savePlatformSettingsToCookie({
            commission: settings.platformFeePct,
            minWithdrawal: settings.minWithdrawalCoins,
            minReferralsForWithdrawal: settings.minReferralsForWithdrawal,
            referralBonusCoins: settings.referralBonusCoins,
            premiumThreshold: settings.premiumThreshold
        });
    }),

    updatePlatformSettings: (data) => get().execute(async () => {
        const updated = await settingsService.updateSettings(data);
        set({ settings: updated });
        // Sync to public shared cookie for the user app
        savePlatformSettingsToCookie({
            commission: updated.platformFeePct,
            minWithdrawal: updated.minWithdrawalCoins,
            minReferralsForWithdrawal: updated.minReferralsForWithdrawal,
            referralBonusCoins: updated.referralBonusCoins,
            premiumThreshold: updated.premiumThreshold
        });
    }, "Kernel parameters updated successfully."),

    enforceGiftPolicy: () => get().execute(async () => {
        const allowed = get().giftPolicy.allowedINR;
        const normalized = get().gifts.map((gift) => {
            const normalizedPrice = allowed.includes(gift.price)
                ? gift.price
                : allowed.reduce((prev, next) =>
                    Math.abs(next - gift.price) < Math.abs(prev - gift.price) ? next : prev,
                );
            return { ...gift, price: normalizedPrice };
        });
        set({ gifts: normalized });
        syncGiftCatalogFromAdminGifts(normalized);
        return normalized;
    }, "Gift ladder normalized to PRD policy (₹2/₹5/₹10)."),

    updateGiftPolicy: (payload) => set((state) => ({
        giftPolicy: { ...state.giftPolicy, ...payload },
    })),

    loadKYCQueue: () => get().execute(async () => {
        const queue = await userService.fetchKYCQueue();
        set({ kycQueue: queue });
    }),

    reviewKYC: (queueId, decision) => get().execute(async () => {
        const item = get().kycQueue.find((entry) => entry.id === queueId);
        if (!item) return;
        if (decision === 'approve' && !item.eligibleByReferral) {
            throw new Error(`KYC approval blocked. Referral onboarding is ${item.referredCount}/5.`);
        }
        if (decision === 'approve') await get().verifyUserKYC(item.userId);
        if (decision === 'reject') {
            patchKYCSubmission(item.userId, { status: 'rejected', payoutsUnlocked: false });
        }
        set((state) => ({
            kycQueue: state.kycQueue.map((entry) =>
                entry.id === queueId ? { ...entry, status: decision === 'approve' ? 'approved' : 'rejected' } : entry,
            ),
            auditLogs: [
                {
                    id: `LOG-${Date.now()}`,
                    action: 'KYC Review',
                    admin: 'SuperAdmin',
                    timestamp: new Date().toISOString(),
                    details: `${decision.toUpperCase()} for ${item.userId}`,
                },
                ...state.auditLogs,
            ],
        }));
    }, "KYC queue updated."),

    // incrementReferralOnboarding is deprecated – referral counts come from the database.
    // The KYC eligibility is now derived server-side via the users API (flagged filter).



    loadSettlementRails: () => get().execute(async () => {
        set({ settlementRails: [...get().settlementRails] });
    }),

    reconcileSettlementRail: (railId) => get().execute(async () => {
        set((state) => ({
            settlementRails: state.settlementRails.map((rail) =>
                rail.id === railId
                    ? { ...rail, reconciled: rail.reconciled + rail.pending, pending: 0, lastRun: 'just now', status: 'active' }
                    : rail,
            ),
            auditLogs: [
                {
                    id: `LOG-${Date.now()}`,
                    action: 'Rail Reconciliation',
                    admin: 'SuperAdmin',
                    timestamp: new Date().toISOString(),
                    details: `Reconciled ${railId}`,
                },
                ...state.auditLogs,
            ],
        }));
    }, "Settlement rail reconciled."),

    financialStats: null,
    transactionsData: { transactions: [], total: 0, page: 1, totalPages: 1 },

    loadFinancials: () => get().execute(async () => {
        const stats = await dashboardService.fetchFinancials();
        set({ financialStats: stats });
    }),

    loadTransactions: (params) => get().execute(async () => {
        const data = await dashboardService.fetchTransactions(params);
        set({ transactionsData: data });
    }),

    linkCampaignClosureAudit: (campaignId) => get().execute(async () => {

        const closure = get().campaignClosures.find((entry) => entry.id === campaignId);
        if (!closure) return;
        set((state) => ({
            campaignClosures: state.campaignClosures.map((entry) =>
                entry.id === campaignId ? { ...entry, auditLinked: true } : entry,
            ),
            auditLogs: [
                {
                    id: `LOG-${Date.now()}`,
                    action: 'Campaign Closure',
                    admin: 'SuperAdmin',
                    timestamp: new Date().toISOString(),
                    details: `Winner ${closure.winner} payout linked for ${closure.title}`,
                },
                ...state.auditLogs,
            ],
        }));
    }, "Campaign closure linked to immutable audit trail."),

    loadCampaignSubmissions: (id) => get().execute(async () => {
        return await campaignService.fetchSubmissions(id);
    }),

    declareCampaignWinners: (id) => get().execute(async () => {
        return await campaignService.declareWinners(id);
    }, "Winners declared."),

    markCampaignRewardDistributed: (campaignId, submissionId) => get().execute(async () => {
        return await campaignService.markRewardDistributed(campaignId, submissionId);
    }, "Reward marked as distributed."),

    loadDashboardStats: () => get().execute(async () => {
        const stats = await dashboardService.fetchStats();
        set({ dashboardStats: stats, exchangeRates: stats.rates });
    }),

    loadExchangeRates: (base) => get().execute(async () => {
        const data = await dashboardService.fetchExchangeRates(base);
        set({ exchangeRates: data.rates });
    }),

    computePRDMetrics: () => get().execute(async () => {

        const voteVolume = useCampaignStore
            .getState()
            .campaigns.reduce((acc, campaign) => acc + campaign.submissions.reduce((s, sub) => s + sub.votes, 0), 0);
        const payoutLatency = get().withdrawals.length
            ? `${Math.max(1, Math.round(get().withdrawals.filter((w) => w.status === 'pending').length * 0.4))}h`
            : '1h';
        set({
            prdMetrics: {
                dauProxy: get().users.length * 17,
                avgGiftsPerUser: (get().gifts.reduce((acc, gift) => acc + gift.usage, 0) / Math.max(1, get().users.length)).toFixed(1),
                campaignParticipation: get().campaigns.reduce((acc, campaign) => acc + (campaign.participants || 0), 0),
                voteVolume,
                payoutLatency,
                brandRetentionProxy: `${Math.min(98, 72 + get().campaigns.length)}%`,
            },
        });
    }),

    notify: (type, message) => set({
        lastSharedAction: { type: type === 'error' ? 'error' : 'success', message, timestamp: Date.now() },
    }),

    // Actions - Notifications
    loadAdminNotifications: (page) => get().execute(async () => {
        const { notifications, unreadCount } = await notificationService.fetchNotifications(page);
        set({ adminNotifications: notifications, unreadAdminNotificationsCount: unreadCount });
    }),

    readAdminNotification: (id) => get().execute(async () => {
        await notificationService.markAsRead(id);
        const unreadCount = id === 'all' ? 0 : Math.max(0, get().unreadAdminNotificationsCount - 1);
        set(state => ({
            unreadAdminNotificationsCount: unreadCount,
            adminNotifications: state.adminNotifications.map(n => (id === 'all' || n.id === id || n._id === id) ? { ...n, isRead: true } : n)
        }));
    }),

    deleteAdminNotification: (id) => get().execute(async () => {
        await notificationService.deleteNotification(id);
        set(state => ({
            adminNotifications: state.adminNotifications.filter(n => (n.id !== id && n._id !== id))
        }));
    }, "Notification dismissed."),

    // Global clear notification
    clearNotification: () => set({ lastSharedAction: null })
}));

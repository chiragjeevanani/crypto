import { create } from 'zustand';
import { giftService } from '../services/giftService';
import { withdrawalService } from '../services/withdrawalService';
import { userService } from '../services/userService';
import { campaignService } from '../services/campaignService';
import { moderationService } from '../services/moderationService';
import { settingsService } from '../services/settingsService';

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
    ledger: [],
    auditLogs: [],
    suspiciousUsers: [],
    settings: null,

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
    }),

    loadTrashGifts: () => get().execute(async () => {
        const trashGifts = await giftService.fetchTrashGifts();
        set({ trashGifts });
    }),

    addGift: (data) => get().execute(async () => {
        const newGift = await giftService.createGift(data);
        set((state) => ({ gifts: [...state.gifts, newGift] }));
    }, "Gift created successfully."),

    updateGift: (id, data) => get().execute(async () => {
        const updated = await giftService.updateGift(id, data);
        set((state) => ({
            gifts: state.gifts.map(g => g.id === id ? updated : g)
        }));
    }, "Gift configuration updated."),

    removeGift: (id) => get().execute(async () => {
        await giftService.deleteGift(id);
        const [gifts, trash] = await Promise.all([giftService.fetchGifts(), giftService.fetchTrashGifts()]);
        set({ gifts, trashGifts: trash });
    }, "Gift moved to trash."),

    restoreGift: (id) => get().execute(async () => {
        await giftService.restoreGift(id);
        const [gifts, trash] = await Promise.all([giftService.fetchGifts(), giftService.fetchTrashGifts()]);
        set({ gifts, trashGifts: trash });
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
        const [ledger, logs] = await Promise.all([
            withdrawalService.fetchLedger(),
            withdrawalService.fetchAuditLogs()
        ]);
        set({ ledger, auditLogs: logs });
    }, "Withdrawal request approved and processed."),

    rejectWithdrawal: (id, reason) => get().execute(async () => {
        const updated = await withdrawalService.rejectWithdrawal(id, reason);
        set((state) => ({
            withdrawals: state.withdrawals.map(w => w.id === id ? updated : w)
        }));
        const logs = await withdrawalService.fetchAuditLogs();
        set({ auditLogs: logs });
    }, "Withdrawal request rejected."),

    getUserFinancialSnapshot: (userId) => get().execute(async () => {
        return await withdrawalService.getUserFinancialSnapshot(userId);
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
        set({ campaigns });
    }),

    setCampaignStatus: (id, status) => get().execute(async () => {
        const updated = await campaignService.updateStatus(id, status);
        set((state) => ({
            campaigns: state.campaigns.map(c => c.id === id ? updated : c)
        }));
    }, `Campaign shifted to ${status}.`),

    // Actions - Moderation
    loadPosts: () => get().execute(async () => {
        const posts = await moderationService.fetchPosts();
        set({ posts });
    }),

    handlePostApproval: (id, approve) => get().execute(async () => {
        let updated;
        if (approve) {
            updated = await moderationService.approvePost(id);
        } else {
            updated = await moderationService.rejectPost(id, "Content policy violation");
        }
        set((state) => ({
            posts: state.posts.map(p => p.id === id ? updated : p)
        }));
    }, approve ? "Post approved for broadcast." : "Post restricted."),

    // Actions - Settings
    loadSettings: () => get().execute(async () => {
        const settings = await settingsService.fetchSettings();
        set({ settings });
    }),

    updatePlatformSettings: (data) => get().execute(async () => {
        const updated = await settingsService.updateSettings(data);
        set({ settings: updated });
    }, "Kernel parameters updated successfully."),

    // Global clear notification
    clearNotification: () => set({ lastSharedAction: null })
}));

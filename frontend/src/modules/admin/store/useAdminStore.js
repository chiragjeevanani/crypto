import { create } from 'zustand';
import { giftService } from '../services/giftService';
import { withdrawalService } from '../services/withdrawalService';
import { userService } from '../services/userService';
import { campaignService } from '../services/campaignService';
import { moderationService } from '../services/moderationService';
import { settingsService } from '../services/settingsService';
import { useCampaignStore } from '../../user/store/useCampaignStore';
import { patchKYCSubmission } from '../../../shared/kycSync';
import { syncGiftCatalogFromAdminGifts } from '../../../shared/giftCatalog';

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
    suspiciousUsers: [],
    settings: null,
    prdMetrics: null,
    giftPolicy: {
        allowedINR: [2, 3, 4, 5, 6, 7, 8, 9, 10],
        strictMode: true,
    },
    kycQueue: [],
    fraudSignals: [
        { id: 'FR-201', type: 'ip_cluster', severity: 'high', entity: 'U-7722', detail: '3 accounts from same /24 subnet', status: 'open' },
        { id: 'FR-202', type: 'device_reuse', severity: 'medium', entity: 'U-7723', detail: 'Shared device fingerprint with flagged account', status: 'open' },
        { id: 'FR-203', type: 'duplicate_submission', severity: 'high', entity: 'POST-4821', detail: 'Near-identical media hash used in multiple campaigns', status: 'open' },
    ],
    settlementRails: [
        { id: 'rail_upi', name: 'UPI', status: 'active', reconciled: 42, pending: 3, lastRun: '5 mins ago' },
        { id: 'rail_bank', name: 'Bank Transfer', status: 'degraded', reconciled: 20, pending: 5, lastRun: '17 mins ago' },
        { id: 'rail_crypto', name: 'Crypto Payout', status: 'active', reconciled: 15, pending: 1, lastRun: '2 mins ago' },
    ],
    campaignClosures: [],

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

    // Actions - Moderation
    loadPosts: () => get().execute(async () => {
        const posts = await moderationService.fetchPosts();
        set({ posts });
    }),

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
    }),

    updatePlatformSettings: (data) => get().execute(async () => {
        const updated = await settingsService.updateSettings(data);
        set({ settings: updated });
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

    incrementReferralOnboarding: (userId) => get().execute(async () => {
        const updated = await userService.incrementReferral(userId);
        if (!updated) return;
        const nextCount = updated.referredCount || 0;
        set((state) => ({
            users: state.users.map((u) => (u.id === userId ? updated : u)),
            usersData: {
                ...state.usersData,
                users: state.usersData.users.map((u) => (u.id === userId ? updated : u)),
            },
            userDetail: state.userDetail?.id === userId
                ? { ...state.userDetail, referredCount: nextCount, referralCode: updated.referralCode }
                : state.userDetail,
            kycQueue: state.kycQueue.map((entry) =>
                entry.userId === userId
                    ? {
                        ...entry,
                        referredCount: nextCount,
                        eligibleByReferral: nextCount >= (entry.requiredReferrals || 5),
                        status: nextCount >= (entry.requiredReferrals || 5) && entry.status !== 'approved'
                            ? 'pending'
                            : entry.status,
                    }
                    : entry,
            ),
        }));
    }, "Referral onboarding count updated."),

    loadFraudSignals: () => get().execute(async () => {
        set({ fraudSignals: [...get().fraudSignals] });
    }),

    resolveFraudSignal: (signalId, resolution = 'resolved') => get().execute(async () => {
        set((state) => ({
            fraudSignals: state.fraudSignals.map((signal) =>
                signal.id === signalId ? { ...signal, status: resolution } : signal,
            ),
            auditLogs: [
                {
                    id: `LOG-${Date.now()}`,
                    action: 'Fraud Resolution',
                    admin: 'SuperAdmin',
                    timestamp: new Date().toISOString(),
                    details: `Signal ${signalId} -> ${resolution}`,
                },
                ...state.auditLogs,
            ],
        }));
    }, "Fraud signal disposition recorded."),

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

    // Global clear notification
    clearNotification: () => set({ lastSharedAction: null })
}));

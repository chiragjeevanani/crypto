import { create } from 'zustand'

export const useUserStore = create((set) => ({
    darkMode: false,
    isAuthenticated: false,
    user: null,
    kyc: {
        status: 'unverified', // unverified | pending | verified
        level: 'L0',
        payoutsUnlocked: false,
        riskFlag: false,
        syncUserId: 'USR-ME',
        referralCode: '',
        referredCount: 0,
        requiredReferrals: 5,
        aadharFrontName: '',
        aadharBackName: '',
        submittedAt: null,
    },
    profile: {
        id: 'me',
        username: 'Chirag J',
        fullName: 'Chirag Jain',
        handle: '@chiragj',
        email: 'chiragj@example.com',
        phone: '+91 98765 43210',
        avatar: null,
        bio: 'Creator | Entrepreneur | Building the future 🚀',
        posts: 1200,
        followers: 48300,
        following: 892,
        badge: 'Top Creator',
        totalEarnings: 28470,
        followersList: [
            { id: 'f1', name: 'Priya Sharma', handle: '@priyasharma' },
            { id: 'f2', name: 'Rahul Verma', handle: '@rahulcooks' },
            { id: 'f3', name: 'Aisha Khan', handle: '@aishafashion' },
            { id: 'f4', name: 'Dev Patel', handle: '@devbuilds' },
        ],
        followingList: [
            { id: 'g1', name: 'Meera Nair', handle: '@meeradances' },
            { id: 'g2', name: 'Arjun Singh', handle: '@arjunfitness' },
            { id: 'g3', name: 'Nikhil Raj', handle: '@nikhilcrafts' },
            { id: 'g4', name: 'Sana Ali', handle: '@sanaedits' },
        ],
    },

    toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

    login: (userData) => set({
        isAuthenticated: true,
        user: userData
    }),

    register: (userData) => set({
        isAuthenticated: true,
        user: userData
    }),

    logout: () => set({
        isAuthenticated: false,
        user: null
    }),

    startKYC: () => set((state) => ({
        kyc: { ...state.kyc, status: 'pending', level: 'L1' },
    })),

    approveKYC: () => set((state) => ({
        kyc: { ...state.kyc, status: 'verified', level: 'L2', payoutsUnlocked: true },
    })),

    flagRisk: (value) => set((state) => ({
        kyc: { ...state.kyc, riskFlag: Boolean(value) },
    })),

    submitKYC: ({ referralCode, aadharFrontName, aadharBackName }) => set((state) => ({
        kyc: {
            ...state.kyc,
            status: 'pending',
            level: 'L1',
            referralCode: (referralCode || '').trim().toUpperCase(),
            aadharFrontName: aadharFrontName || '',
            aadharBackName: aadharBackName || '',
            submittedAt: new Date().toISOString(),
        },
    })),

    incrementReferralOnboarded: () => set((state) => {
        const nextCount = Math.min(100, (state.kyc.referredCount || 0) + 1)
        const hasDocs = Boolean(state.kyc.aadharFrontName) && Boolean(state.kyc.aadharBackName)
        const canAutoApprove = hasDocs && nextCount >= (state.kyc.requiredReferrals || 5)
        return {
            kyc: {
                ...state.kyc,
                referredCount: nextCount,
                status: canAutoApprove ? 'verified' : (state.kyc.status === 'unverified' ? 'pending' : state.kyc.status),
                level: canAutoApprove ? 'L2' : state.kyc.level,
                payoutsUnlocked: canAutoApprove ? true : state.kyc.payoutsUnlocked,
            },
        }
    }),

    setKYCFromSync: (payload) => set((state) => {
        if (!payload) return state
        const required = payload.requiredReferrals || state.kyc.requiredReferrals || 5
        const count = payload.referredCount ?? state.kyc.referredCount
        const approved = payload.status === 'approved'
        return {
            kyc: {
                ...state.kyc,
                referralCode: payload.referralCode ?? state.kyc.referralCode,
                referredCount: count,
                requiredReferrals: required,
                aadharFrontName: payload.aadharFrontName ?? state.kyc.aadharFrontName,
                aadharBackName: payload.aadharBackName ?? state.kyc.aadharBackName,
                submittedAt: payload.submittedAt ?? state.kyc.submittedAt,
                status: approved ? 'verified' : (payload.status || state.kyc.status),
                level: approved ? 'L2' : state.kyc.level,
                payoutsUnlocked: approved ? true : Boolean(payload.payoutsUnlocked ?? state.kyc.payoutsUnlocked),
            },
        }
    }),

    updateProfile: (data) => set((state) => ({
        profile: { ...state.profile, ...data },
    })),
}))

import { create } from 'zustand'
import { authService } from '../../auth/services/authService'

const TOKEN_KEY = 'crypto_auth_token'
const REFRESH_TOKEN_KEY = 'crypto_refresh_token'
const USER_KEY = 'crypto_auth_user'

const getStoredToken = () => localStorage.getItem(TOKEN_KEY)
const getStoredRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)
const getStoredUser = () => {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
        return JSON.parse(raw)
    } catch {
        return null
    }
}

const saveAuthToStorage = ({ token, refreshToken, user }) => {
    if (token != null) localStorage.setItem(TOKEN_KEY, token)
    if (refreshToken != null) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    if (user != null) localStorage.setItem(USER_KEY, JSON.stringify(user))
}

const clearAuthStorage = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
}

const defaultProfile = {
    id: '',
    username: '',
    fullName: '',
    handle: '',
    email: '',
    phone: '',
    avatar: null,
    bio: '',
    countryCode: '',
    countryName: '',
    currencyCode: 'INR',
    currencySymbol: '₹',
    posts: 0,
    followers: 0,
    following: 0,
    badge: '',
    totalEarnings: 0,
    followersList: [],
    followingList: [],
}

function profileFromUser(user) {
    if (!user) return defaultProfile
    const name = user.name || ''
    const handle = user.handle || `@${name.replace(/\s+/g, '').toLowerCase() || 'user'}`
    return {
        id: user.id,
        username: name,
        fullName: name,
        handle: handle.startsWith('@') ? handle : `@${handle}`,
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || null,
        bio: user.bio || '',
        countryCode: user.countryCode || '',
        countryName: user.countryName || '',
        currencyCode: user.currencyCode || 'INR',
        currencySymbol: user.currencySymbol || '₹',
        posts: 0,
        followers: 0,
        following: 0,
        badge: '',
        totalEarnings: 0,
        followersList: [],
        followingList: [],
    }
}

const storedUser = getStoredUser()

export const useUserStore = create((set, get) => ({
    darkMode: false,
    isAuthenticated: Boolean(getStoredToken()),
    token: getStoredToken(),
    authChecked: false,
    authLoading: false,
    authError: '',
    user: storedUser,
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
    profile: storedUser ? profileFromUser(storedUser) : defaultProfile,

    toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    setAuthError: (message) => set({ authError: message || '' }),

    initializeAuth: async () => {
        let token = get().token || getStoredToken()
        const refreshToken = getStoredRefreshToken()

        if (!token && !refreshToken) {
            set({ isAuthenticated: false, user: null, authChecked: true, authLoading: false })
            return
        }

        set({ authLoading: true, authError: '' })
        try {
            if (token) {
                const response = await authService.getMe(token)
                const user = response.user
                saveAuthToStorage({ token, refreshToken, user })
                set({ token, user, profile: profileFromUser(user), isAuthenticated: true, authChecked: true, authLoading: false })
                return
            }
        } catch (_) {
            // access token invalid or expired; try refresh
        }

        if (refreshToken) {
            try {
                const response = await authService.refresh(refreshToken)
                const newToken = response.token
                const newRefresh = response.refreshToken
                const user = response.user
                saveAuthToStorage({ token: newToken, refreshToken: newRefresh, user })
                set({ token: newToken, user, profile: profileFromUser(user), isAuthenticated: true, authChecked: true, authLoading: false })
                return
            } catch (_) {
                // refresh failed
            }
        }

        clearAuthStorage()
        set({
            token: null,
            user: null,
            profile: defaultProfile,
            isAuthenticated: false,
            authChecked: true,
            authLoading: false,
            authError: ''
        })
    },

    loginUser: async ({ email, password }) => {
        set({ authLoading: true, authError: '' })
        try {
            const response = await authService.loginUser({ email, password })
            const { token, refreshToken, user } = response
            saveAuthToStorage({ token, refreshToken, user })
            set({
                token,
                user,
                profile: profileFromUser(user),
                isAuthenticated: true,
                authChecked: true,
                authLoading: false,
                authError: ''
            })
            return { user }
        } catch (error) {
            set({ authLoading: false, authError: error.message })
            throw error
        }
    },

    loginAdmin: async ({ email, password }) => {
        set({ authLoading: true, authError: '' })
        try {
            const response = await authService.loginAdmin({ email, password })
            const { token, refreshToken, user } = response
            saveAuthToStorage({ token, refreshToken, user })
            set({
                token,
                user,
                profile: profileFromUser(user),
                isAuthenticated: true,
                authChecked: true,
                authLoading: false,
                authError: ''
            })
            return { user }
        } catch (error) {
            set({ authLoading: false, authError: error.message })
            throw error
        }
    },

    registerUser: async ({ name, email, password, phone, countryCode }) => {
        set({ authLoading: true, authError: '' })
        try {
            const response = await authService.register({ name, email, password, phone, countryCode })
            const { token, refreshToken, user } = response
            saveAuthToStorage({ token, refreshToken, user })
            set({
                token,
                user,
                profile: profileFromUser(user),
                isAuthenticated: true,
                authChecked: true,
                authLoading: false,
                authError: ''
            })
            return { user }
        } catch (error) {
            set({ authLoading: false, authError: error.message })
            throw error
        }
    },

    login: (userData) => set({
        isAuthenticated: true,
        user: userData
    }),

    register: (userData) => set({
        isAuthenticated: true,
        user: userData
    }),

    logout: () => {
        clearAuthStorage()
        set({
            token: null,
            isAuthenticated: false,
            user: null,
            profile: defaultProfile,
            authError: '',
            authLoading: false,
            authChecked: true
        })
    },

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

    updateProfile: async (data) => {
        const token = get().token
        if (!token) return
        try {
            const payload = {}
            const name = data.name ?? data.fullName ?? data.username
            if (name !== undefined) payload.name = name
            if (data.email !== undefined) payload.email = data.email
            if (data.phone !== undefined) payload.phone = data.phone
            if (data.bio !== undefined) payload.bio = data.bio
            if (data.avatar !== undefined) payload.avatar = data.avatar
            if (data.handle !== undefined) payload.handle = data.handle?.startsWith('@') ? data.handle.slice(1) : data.handle
            const response = await authService.updateProfile(token, payload)
            const user = response.user
            saveAuthToStorage({ token, user: { ...get().user, ...user } })
            set({ user: { ...get().user, ...user }, profile: profileFromUser({ ...get().user, ...user }) })
        } catch (err) {
            throw err
        }
    },
}))

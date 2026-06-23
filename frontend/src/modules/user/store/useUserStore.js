import { create } from 'zustand'
import { authService } from '../../auth/services/authService'
import { DEFAULT_PLATFORM_SETTINGS } from '../../../shared/platformSettings'

export const getKeys = () => {
    const isAdmin = window.location.pathname.startsWith('/admin')
    const prefix = isAdmin ? 'admin_' : ''
    const keys = {
        TOKEN_KEY: `crypto_${prefix}auth_token`,
        REFRESH_TOKEN_KEY: `crypto_${prefix}refresh_token`,
        USER_KEY: `crypto_${prefix}auth_user`
    }
    return keys;
}

export const getStoredToken = () => {
    const { TOKEN_KEY } = getKeys()
    return localStorage.getItem(TOKEN_KEY)
}

export const getStoredRefreshToken = () => {
    const { REFRESH_TOKEN_KEY } = getKeys()
    return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const getStoredUser = () => {
    const { USER_KEY } = getKeys()
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
        return JSON.parse(raw)
    } catch {
        return null
    }
}

export const saveAuthToStorage = ({ token, refreshToken, user }) => {
    const { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } = getKeys()
    if (token != null) localStorage.setItem(TOKEN_KEY, token)
    if (refreshToken != null) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    if (user != null) localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearAuthStorage = () => {
    const { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } = getKeys()
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
    currencyCode: '',
    currencySymbol: '',
    posts: 0,
    followers: 0,
    following: 0,
    badge: '',
    totalEarnings: 0,
    followersList: [],
    followingList: [],
    state: '',
    language: 'English',
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
        currencyCode: user.currencyCode || '',
        currencySymbol: user.currencySymbol || '',
        posts: 0,
        followers: 0,
        following: 0,
        badge: '',
        totalEarnings: user.earningCoins || 0,
        referralCode: user.referralCode || '',
        referralCount: user.referralCount || 0,
        followersList: [],
        followingList: [],
        state: user.state || '',
        language: user.language || 'English',
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
        requiredReferrals: DEFAULT_PLATFORM_SETTINGS.minReferralsForWithdrawal || 5,
        aadharFrontName: '',
        aadharBackName: '',
        submittedAt: null,
    },
    profile: storedUser ? profileFromUser(storedUser) : defaultProfile,
    exchangeRates: null,

    fetchExchangeRates: async () => {
        if (get().exchangeRates) return;
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
            const res = await fetch(`${API_BASE}/config/exchange-rates`)
            const data = await res.json()
            if (data.success) {
                set({ exchangeRates: data.rates })
            }
        } catch (err) {
            console.error('Failed to fetch exchange rates:', err)
        }
    },

    toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    setAuthError: (message) => set({ authError: message || '' }),

    initializeAuth: async () => {
        let token = get().token || getStoredToken()
        const refreshToken = getStoredRefreshToken()

        if (!token && !refreshToken) {
            set({ isAuthenticated: false, user: null, authChecked: true, authLoading: false })
            return
        }

        // Only show loading if we haven't checked yet or if we're not authenticated
        if (!get().authChecked || !get().isAuthenticated) {
            set({ authLoading: true, authError: '' })
        }
        try {
            if (token) {
                const response = await authService.getMe(token)
                const user = response.user
                saveAuthToStorage({ token, refreshToken, user })
                set((state) => ({ 
                    token, 
                    user, 
                    profile: profileFromUser(user), 
                    isAuthenticated: true, 
                    authChecked: true, 
                    authLoading: false,
                    kyc: { 
                        ...state.kyc, 
                        status: user.kyc?.status || user.kycStatus || 'unverified',
                        referredCount: user.referralCount || 0,
                        referralCode: user.referralCode || '',
                        rejectionReason: user.kyc?.rejectionReason || '',
                        // Preserve local URLs if backend doesn't send them (to avoid base64 bloat)
                        aadharFrontUrl: user.kyc?.documents?.aadharFrontUrl || state.kyc.aadharFrontUrl || '',
                        aadharBackUrl: user.kyc?.documents?.aadharBackUrl || state.kyc.aadharBackUrl || '',
                        panCardUrl: user.kyc?.documents?.panCardUrl || state.kyc.panCardUrl || '',
                        aadharNumber: user.kyc?.aadharNumber || state.kyc.aadharNumber || '',
                        panNumber: user.kyc?.panNumber || state.kyc.panNumber || '',
                        syncUserId: user.id
                    }
                }))
                return
            }
        } catch (err) {
            const status = err?.response?.status || err?.status
            const msg = err?.message || ""
            const isAuthError = status === 401 || status === 403 || 
                                msg.toLowerCase().includes("unauthorized") || 
                                msg.toLowerCase().includes("expired") || 
                                msg.toLowerCase().includes("invalid token")
            
            // If it's NOT a definitive auth error (e.g. network down, 500, timeout), DON'T log out.
            // Just mark check as done so UI can continue.
            if (!isAuthError) {
                console.warn('[Auth] Transient error during session check:', msg)
                set({ authChecked: true, authLoading: false })
                return
            }
            // Definitive auth error, proceed to refresh or logout
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
            } catch (err) {
                const status = err?.response?.status || err?.status
                const msg = err?.message || ""
                const isAuthError = status === 401 || status === 403 || 
                                    msg.toLowerCase().includes("expired") || 
                                    msg.toLowerCase().includes("invalid token")
                if (!isAuthError) {
                    set({ authChecked: true, authLoading: false })
                    return
                }
                // refresh failed (token expired/invalid), will clear below
            }
        }

        if (get().token || getStoredToken()) {
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
        } else {
            set({ authChecked: true, authLoading: false })
        }
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
            if (error.response?.data?.requireVerification || error.data?.requireVerification) {
                set({ authLoading: false, authError: '' })
                throw error;
            }
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

    registerUser: async ({ name, email, password, phone, countryCode, state, language, referralCode, agreedToTerms }) => {
        set({ authLoading: true, authError: '' })
        try {
            const response = await authService.register({ name, email, password, phone, countryCode, state, language, referralCode, agreedToTerms })
            if (response.requireVerification || response.response?.data?.requireVerification) {
                set({ authLoading: false, authError: '' })
                return response.response?.data || response;
            }
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

    verifyEmail: async (email, otp) => {
        set({ authLoading: true, authError: '' })
        try {
            const response = await authService.verifyEmail(email, otp)
            set({
                authLoading: false,
                authError: ''
            })
            return response
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
        const canAutoApprove = hasDocs && nextCount >= (state.kyc.requiredReferrals || DEFAULT_PLATFORM_SETTINGS.minReferralsForWithdrawal || 5)
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
        const required = payload.requiredReferrals || state.kyc.requiredReferrals || DEFAULT_PLATFORM_SETTINGS.minReferralsForWithdrawal || 5
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
            let mergedUser = get().user || {}
            if (data?.avatarFile) {
                const uploadRes = await authService.uploadAvatar(token, data.avatarFile)
                if (uploadRes?.user) {
                    mergedUser = { ...mergedUser, ...uploadRes.user }
                }
            }
            // Construct payload with explicit field checks
            const payload = {}
            
            // Handle name logic: prioritize explicit name, then fullName, then username
            // In the Settings menu, fullName corresponds to 'name' in DB, 
            // while username might be a legacy field or display name.
            if (data.name !== undefined) {
                payload.name = data.name
            } else if (data.fullName !== undefined) {
                payload.name = data.fullName
            } else if (data.username !== undefined) {
                payload.name = data.username
            }

            if (data.email !== undefined) payload.email = data.email
            if (data.phone !== undefined) payload.phone = data.phone
            
            // Ensure bio is passed if it exists in the data object
            if (data.bio !== undefined) {
                payload.bio = data.bio
            }

            if (data.avatar !== undefined) payload.avatar = data.avatar
            
            if (data.handle !== undefined) {
                // Remove @ if user added it manually
                payload.handle = data.handle?.startsWith('@') ? data.handle.slice(1) : data.handle
            }
            
            if (data.state !== undefined) payload.state = data.state
            if (data.language !== undefined) payload.language = data.language


            let user = mergedUser
            if (Object.keys(payload).length > 0) {
                const response = await authService.updateProfile(token, payload)
                
                if (response?.user) {
                    user = { ...user, ...response.user }
                } else {
                    console.warn("[Store] Backend did not return user object, falling back to local merge");
                    user = { ...user, ...payload }
                }
            }

            // Sync with storage and state
            saveAuthToStorage({ token, user })
            set((state) => ({ 
                user, 
                profile: profileFromUser(user),
                kyc: {
                    ...state.kyc,
                    status: user.kycStatus || 'unverified'
                }
            }))
            
            return { success: true, user }
        } catch (err) {
            console.warn("[Store] Profile update failed:", err.message)
            throw err
        }
    },
}))

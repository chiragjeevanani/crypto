import { create } from 'zustand'

export const useUserStore = create((set) => ({
    darkMode: true,
    isAuthenticated: false,
    user: null,
    profile: {
        id: 'me',
        username: 'Chirag J',
        handle: '@chiragj',
        avatar: null,
        bio: 'Creator | Entrepreneur | Building the future 🚀',
        posts: 1200,
        followers: 48300,
        following: 892,
        badge: 'Top Creator',
        totalEarnings: 28470,
    },

    toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

    login: (userData) => set({
        isAuthenticated: true,
        user: userData
    }),

    logout: () => set({
        isAuthenticated: false,
        user: null
    }),

    updateProfile: (data) => set((state) => ({
        profile: { ...state.profile, ...data },
    })),
}))

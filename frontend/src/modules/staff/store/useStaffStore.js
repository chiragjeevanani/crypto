import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';
const TOKEN_KEY = 'crypto_staff_auth_token';
const STAFF_KEY = 'crypto_staff_auth_user';

// Restore persisted session from localStorage
const getPersistedStaff = () => {
    try {
        const raw = localStorage.getItem(STAFF_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const useStaffStore = create((set, get) => ({
    staff: getPersistedStaff(),
    token: localStorage.getItem(TOKEN_KEY) || null,
    loading: false,
    error: null,

    // Computed helpers
    get isAuthenticated() { return !!get().token && !!get().staff; },
    get grantedMenus() { return get().staff?.grantedMenus || []; },
    hasMenuAccess: (key) => (get().staff?.grantedMenus || []).includes(key),

    clearError: () => set({ error: null }),

    loginStaff: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const res = await fetch(`${API_BASE}/auth/staff/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!data.success) {
                set({ error: data.message || 'Login failed', loading: false });
                return false;
            }
            localStorage.setItem(TOKEN_KEY, data.token);
            localStorage.setItem(STAFF_KEY, JSON.stringify(data.staff));
            set({ token: data.token, staff: data.staff, loading: false, error: null });
            return true;
        } catch {
            set({ error: 'Network error. Please try again.', loading: false });
            return false;
        }
    },

    logoutStaff: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(STAFF_KEY);
        set({ token: null, staff: null, error: null });
    },

    // Update staff profile in store after profile page edits
    updateStaffProfile: (updates) => {
        const current = get().staff;
        if (!current) return;
        const updated = { ...current, ...updates };
        localStorage.setItem(STAFF_KEY, JSON.stringify(updated));
        set({ staff: updated });
    },

    // Get the Authorization header for API calls from staff portal
    getAuthHeader: () => {
        const token = get().token;
        return token ? { Authorization: `Bearer ${token}` } : {};
    },
}));

// Simulated delay for "backend" calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const ADMIN_GIFTS_KEY = 'socialearn_admin_gifts_v1'
const ADMIN_TRASH_GIFTS_KEY = 'socialearn_admin_trash_gifts_v1'

const defaultGifts = [
    { id: 1, name: 'Rose', price: 2, value: 2, icon: '🌹', status: 'Active', usage: 12402 },
    { id: 2, name: 'Egg', price: 2, value: 2, icon: '🥚', status: 'Active', usage: 842 },
    { id: 3, name: 'Tomato', price: 3, value: 3, icon: '🍅', status: 'Active', usage: 124 },
    { id: 4, name: 'Golden Heart', price: 5, value: 5, icon: '💛', status: 'Active', usage: 0 },
    { id: 5, name: 'Premium Heart', price: 10, value: 10, icon: '💎', status: 'Active', usage: 0 },
]

function readList(key, fallback) {
    if (typeof window === 'undefined') return [...fallback]
    try {
        const raw = window.localStorage.getItem(key)
        if (!raw) return [...fallback]
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : [...fallback]
    } catch {
        return [...fallback]
    }
}

function writeList(key, value) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, JSON.stringify(value))
}

function saveGiftState(gifts, trash) {
    writeList(ADMIN_GIFTS_KEY, gifts)
    writeList(ADMIN_TRASH_GIFTS_KEY, trash)
}

let mockGifts = readList(ADMIN_GIFTS_KEY, defaultGifts)
let mockTrashGifts = readList(ADMIN_TRASH_GIFTS_KEY, [])
saveGiftState(mockGifts, mockTrashGifts)

export const calculateGiftRevenue = (gift) => {
    return (gift.price * gift.usage);
};

export const giftService = {
    fetchGifts: async () => {
        await delay(800);
        mockGifts = readList(ADMIN_GIFTS_KEY, defaultGifts)
        return [...mockGifts];
    },

    fetchTrashGifts: async () => {
        await delay(600);
        mockTrashGifts = readList(ADMIN_TRASH_GIFTS_KEY, [])
        return [...mockTrashGifts];
    },

    createGift: async (giftData) => {
        await delay(1000);
        const safePrice = Math.max(2, Math.min(10, Math.round(Number(giftData?.price || 2))))
        const newGift = {
            ...giftData,
            price: safePrice,
            value: safePrice,
            id: Date.now(),
            usage: 0
        };
        mockGifts.push(newGift);
        saveGiftState(mockGifts, mockTrashGifts)
        return newGift;
    },

    updateGift: async (id, giftData) => {
        await delay(1000);
        const safePrice = Math.max(2, Math.min(10, Math.round(Number(giftData?.price || 2))))
        mockGifts = mockGifts.map(g => g.id === id ? { ...g, ...giftData, price: safePrice, value: safePrice } : g);
        saveGiftState(mockGifts, mockTrashGifts)
        return mockGifts.find(g => g.id === id);
    },

    deleteGift: async (id) => {
        await delay(1000);
        const index = mockGifts.findIndex(g => g.id === id);
        if (index !== -1) {
            const [gift] = mockGifts.splice(index, 1);
            mockTrashGifts.push({ ...gift, deletedAt: new Date().toISOString() });
            saveGiftState(mockGifts, mockTrashGifts)
        }
        return true;
    },

    restoreGift: async (id) => {
        await delay(800);
        const index = mockTrashGifts.findIndex(g => g.id === id);
        if (index !== -1) {
            const [gift] = mockTrashGifts.splice(index, 1);
            const { deletedAt, ...rest } = gift;
            mockGifts.push(rest);
            saveGiftState(mockGifts, mockTrashGifts)
            return rest;
        }
        throw new Error("Gift not found in trash.");
    },

    permanentlyDeleteGift: async (id) => {
        await delay(1000);
        mockTrashGifts = mockTrashGifts.filter(g => g.id !== id);
        saveGiftState(mockGifts, mockTrashGifts)
        return true;
    },

    toggleStatus: async (id) => {
        await delay(500);
        const gift = mockGifts.find(g => g.id === id);
        if (gift) {
            gift.status = gift.status === 'Active' ? 'Inactive' : 'Active';
            saveGiftState(mockGifts, mockTrashGifts)
        }
        return gift;
    }
};

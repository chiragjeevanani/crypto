// Simulated delay for "backend" calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let mockGifts = [
    { id: 1, name: 'Rose', price: 10, value: 0.10, icon: '🌹', status: 'Active', usage: 12402, commission: 15 },
    { id: 2, name: 'Rocket', price: 500, value: 5.00, icon: '🚀', status: 'Active', usage: 842, commission: 15 },
    { id: 3, name: 'Diamond', price: 1000, value: 10.00, icon: '💎', status: 'Active', usage: 124, commission: 15 },
    { id: 4, name: 'Crown', price: 5000, value: 50.00, icon: '👑', status: 'Inactive', usage: 0, commission: 20 },
];

let mockTrashGifts = [];

export const calculateGiftRevenue = (gift) => {
    return (gift.price * gift.usage);
};

export const giftService = {
    fetchGifts: async () => {
        await delay(800);
        return [...mockGifts];
    },

    fetchTrashGifts: async () => {
        await delay(600);
        return [...mockTrashGifts];
    },

    createGift: async (giftData) => {
        await delay(1000);
        const newGift = {
            ...giftData,
            id: Date.now(),
            usage: 0
        };
        mockGifts.push(newGift);
        return newGift;
    },

    updateGift: async (id, giftData) => {
        await delay(1000);
        mockGifts = mockGifts.map(g => g.id === id ? { ...g, ...giftData } : g);
        return mockGifts.find(g => g.id === id);
    },

    deleteGift: async (id) => {
        await delay(1000);
        const index = mockGifts.findIndex(g => g.id === id);
        if (index !== -1) {
            const [gift] = mockGifts.splice(index, 1);
            mockTrashGifts.push({ ...gift, deletedAt: new Date().toISOString() });
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
            return rest;
        }
        throw new Error("Gift not found in trash.");
    },

    permanentlyDeleteGift: async (id) => {
        await delay(1000);
        mockTrashGifts = mockTrashGifts.filter(g => g.id !== id);
        return true;
    },

    toggleStatus: async (id) => {
        await delay(500);
        const gift = mockGifts.find(g => g.id === id);
        if (gift) {
            gift.status = gift.status === 'Active' ? 'Inactive' : 'Active';
        }
        return gift;
    }
};

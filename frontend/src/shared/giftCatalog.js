const GIFT_CATALOG_KEY = 'socialearn_gift_catalog_v1'

const DEFAULT_GIFTS = [
    { id: 'rose', emoji: '🌹', name: 'Rose', price: 2, status: 'Active' },
    { id: 'egg', emoji: '🥚', name: 'Egg', price: 2, status: 'Active' },
    { id: 'tomato', emoji: '🍅', name: 'Tomato', price: 3, status: 'Active' },
    { id: 'heart', emoji: '💛', name: 'Golden Heart', price: 5, status: 'Active' },
    { id: 'premium-heart', emoji: '💎', name: 'Premium Heart', price: 10, status: 'Active' },
]

function normalizeGift(gift, idx = 0) {
    const price = Number(gift?.price || 0)
    return {
        id: String(gift?.id || `gift_${idx}_${Date.now()}`),
        emoji: String(gift?.emoji || gift?.icon || '🎁'),
        name: String(gift?.name || 'Gift'),
        price: Number.isFinite(price) ? Math.max(2, Math.min(10, Math.round(price))) : 2,
        status: String(gift?.status || 'Active'),
    }
}

function normalizeCatalog(list) {
    if (!Array.isArray(list) || !list.length) return DEFAULT_GIFTS.map(normalizeGift)
    return list.map((gift, idx) => normalizeGift(gift, idx))
}

export function getGiftCatalog() {
    if (typeof window === 'undefined') return normalizeCatalog(DEFAULT_GIFTS)
    try {
        const raw = window.localStorage.getItem(GIFT_CATALOG_KEY)
        if (!raw) return normalizeCatalog(DEFAULT_GIFTS)
        const parsed = JSON.parse(raw)
        return normalizeCatalog(parsed)
    } catch {
        return normalizeCatalog(DEFAULT_GIFTS)
    }
}

export function getActiveGiftCatalog() {
    const items = getGiftCatalog()
    const active = items.filter((gift) => String(gift.status).toLowerCase() === 'active')
    return active.length ? active : normalizeCatalog(DEFAULT_GIFTS).filter((gift) => String(gift.status).toLowerCase() === 'active')
}

export function saveGiftCatalog(items) {
    if (typeof window === 'undefined') return
    const normalized = normalizeCatalog(items)
    window.localStorage.setItem(GIFT_CATALOG_KEY, JSON.stringify(normalized))
    window.dispatchEvent(new CustomEvent('gift-catalog-updated'))
}

export function syncGiftCatalogFromAdminGifts(adminGifts) {
    const mapped = (adminGifts || []).map((gift, idx) => normalizeGift({
        id: `gift_${gift.id || idx + 1}`,
        emoji: gift.icon,
        name: gift.name,
        price: gift.price,
        status: gift.status,
    }, idx))
    saveGiftCatalog(mapped)
}

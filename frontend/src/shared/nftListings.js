const NFT_LISTINGS_KEY = 'socialearn_user_nft_listings_v1'

function normalizeListing(item, idx = 0) {
    return {
        id: String(item?.id || `user_nft_${Date.now()}_${idx}`),
        title: String(item?.title || 'Untitled NFT'),
        thumbnail: String(item?.thumbnail || ''),
        price: Math.max(1, Math.round(Number(item?.price || 1))),
        currency: 'INR',
        status: String(item?.status || 'listed'),
        buyer: item?.buyer || null,
        listedAt: item?.listedAt || new Date().toISOString(),
        soldAt: item?.soldAt || null,
        views: Math.max(0, Math.round(Number(item?.views || 0))),
        bids: Math.max(0, Math.round(Number(item?.bids || 0))),
        creatorId: String(item?.creatorId || 'me'),
        creatorName: String(item?.creatorName || 'Creator'),
        creatorHandle: String(item?.creatorHandle || '@creator'),
        source: 'user',
    }
}

function normalizeListings(items) {
    if (!Array.isArray(items) || !items.length) return []
    return items.map((item, idx) => normalizeListing(item, idx))
}

export function getUserNFTListings() {
    if (typeof window === 'undefined') return []
    try {
        const raw = window.localStorage.getItem(NFT_LISTINGS_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return normalizeListings(parsed)
    } catch {
        return []
    }
}

function writeListings(items) {
    if (typeof window === 'undefined') return
    const safe = normalizeListings(items)
    window.localStorage.setItem(NFT_LISTINGS_KEY, JSON.stringify(safe))
    window.dispatchEvent(new CustomEvent('nft-listings-updated'))
}

export function addUserNFTListing(payload) {
    const current = getUserNFTListings()
    const next = [normalizeListing(payload), ...current]
    writeListings(next)
    return next
}

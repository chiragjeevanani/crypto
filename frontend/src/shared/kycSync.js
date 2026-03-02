const KYC_SYNC_KEY = 'socialearn_kyc_sync_v1'

function readStore() {
    if (typeof window === 'undefined') return []
    try {
        const raw = window.localStorage.getItem(KYC_SYNC_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function writeStore(records) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(KYC_SYNC_KEY, JSON.stringify(records))
    window.dispatchEvent(new CustomEvent('kyc-sync-updated'))
}

export function getKYCSubmissions() {
    return readStore()
}

export function getKYCSubmissionByUser(userId) {
    return readStore().find((item) => item.userId === userId) || null
}

export function upsertKYCSubmission(payload) {
    const current = readStore()
    const idx = current.findIndex((item) => item.userId === payload.userId)
    const nextItem = {
        requiredReferrals: 5,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        ...payload,
    }
    if (idx === -1) {
        writeStore([nextItem, ...current])
        return nextItem
    }
    const merged = {
        ...current[idx],
        ...nextItem,
        updatedAt: new Date().toISOString(),
    }
    const next = [...current]
    next[idx] = merged
    writeStore(next)
    return merged
}

export function patchKYCSubmission(userId, patch) {
    const current = readStore()
    const idx = current.findIndex((item) => item.userId === userId)
    if (idx === -1) return null
    const nextItem = {
        ...current[idx],
        ...patch,
        updatedAt: new Date().toISOString(),
    }
    const next = [...current]
    next[idx] = nextItem
    writeStore(next)
    return nextItem
}


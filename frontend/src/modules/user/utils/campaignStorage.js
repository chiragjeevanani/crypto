const JOINED_KEY = 'crypto_joined_campaigns_v1'

export const getJoinedCampaignIds = () => {
    if (typeof window === 'undefined') return []
    try {
        const raw = window.localStorage.getItem(JOINED_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
        return []
    }
}

export const saveJoinedCampaignIds = (ids) => {
    if (typeof window === 'undefined') return []
    const unique = Array.from(new Set((ids || []).map(String)))
    window.localStorage.setItem(JOINED_KEY, JSON.stringify(unique))
    window.dispatchEvent(new CustomEvent('user-campaigns-joined', { detail: unique }))
    return unique
}

export const markCampaignJoined = (id) => {
    if (!id) return []
    const current = getJoinedCampaignIds()
    if (current.includes(String(id))) return current
    return saveJoinedCampaignIds([...current, String(id)])
}

import { useUserStore } from '../store/useUserStore'

export function formatCurrency(amount, symbol = '₹') {
    if (amount >= 1000) {
        return `${symbol}${(amount / 1000).toFixed(1)}K`
    }
    return `${symbol}${amount}`
}

/** @deprecated Use useUserCurrency() hook instead to get the user's actual currency symbol */
export function formatINR(amount) {
    return formatCurrency(amount, '₹')
}

export function formatCount(n) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return String(n)
}

export function timeAgo(isoDate) {
    const diff = (Date.now() - new Date(isoDate)) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

export function daysLeft(isoDate) {
    const ms = new Date(isoDate) - Date.now()
    const d = Math.ceil(ms / 86400000)
    return d <= 0 ? 'Ended' : d === 1 ? '1 day left' : `${d} days left`
}

/**
 * React hook — returns the current user's currency symbol and a formatter function.
 * Usage:
 *   const { symbol, code, format } = useUserCurrency()
 *   format(1500) → "A$1.5K"
 */
export function useUserCurrency() {
    const profile = useUserStore(state => state.profile)
    const symbol = profile?.currencySymbol || '₹'
    const code   = profile?.currencyCode   || 'INR'
    const format = (amount) => formatCurrency(amount, symbol)
    return { symbol, code, format }
}

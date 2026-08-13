import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Bell, UserPlus, Heart, Gift, Megaphone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useFeedStore } from '../store/useFeedStore'
import { useUserStore } from '../store/useUserStore'
import { followService } from '../services/followService'
import { optimizeCloudinaryUrl } from '../../../utils/mediaOptimization'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NotifIcon = ({ type }) => {
    if (type === 'gift' || type === 'premium_gift') return <span className="text-xl">🎁</span>
    if (type === 'follower_broadcast') return <span className="text-xl">💛</span>
    if (type === 'follow') return <UserPlus size={20} />
    if (type === 'recommendation') return <span className="text-xl">✨</span>
    if (type === 'mention') return <span className="text-xl">@</span>
    if (type === 'tag') return <span className="text-xl">🏷️</span>
    return <Bell size={20} />
}

const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const groupByDate = (notifications) => {
    if (!notifications || notifications.length === 0) return []
    
    const today = new Date().toDateString()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()

    const groupMap = new Map()

    for (const n of notifications) {
        if (!n.createdAt) continue
        const d = new Date(n.createdAt)
        const dStr = d.toDateString()
        
        let label
        if (dStr === today) {
            label = 'Today'
        } else if (dStr === yesterdayStr) {
            label = 'Yesterday'
        } else {
            label = d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
        }

        if (!groupMap.has(label)) {
            groupMap.set(label, [])
        }
        groupMap.get(label).push(n)
    }

    return Array.from(groupMap.entries()).map(([label, items]) => ({ label, items }))
}

// ─── Suggestion Card ─────────────────────────────────────────────────────────

function SuggestionCard({ user }) {
    const [followed, setFollowed] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleFollow = async (e) => {
        e.stopPropagation()
        if (loading || followed) return
        setLoading(true)
        try {
            await followService.toggleFollow(user.id)
            setFollowed(true)
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/user/${user.id}`)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer hover:bg-surface2 transition-all active:scale-[0.98]"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--color-surface2)' }}>
                <img 
                    src={optimizeCloudinaryUrl(user.avatar, { width: 80 })} 
                    alt={user.name} 
                    className={`w-full h-full object-cover ${!user.avatar ? 'opacity-60' : ''}`} 
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{user.name}</p>
                <p className="text-xs opacity-50 truncate">{user.handle ? `@${user.handle}` : ''}</p>
                {user.mutualCount > 0 && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-primary)' }}>
                        {user.mutualCount} mutual connection{user.mutualCount > 1 ? 's' : ''}
                    </p>
                )}
            </div>
            <button
                onClick={handleFollow}
                disabled={loading || followed}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
                style={{
                    background: followed ? 'var(--color-surface2)' : 'var(--color-primary)',
                    color: followed ? 'var(--color-muted)' : '#000',
                    opacity: loading ? 0.6 : 1
                }}
            >
                {followed ? 'Following' : 'Follow'}
            </button>
        </motion.div>
    )
}

// ─── Shimmer ─────────────────────────────────────────────────────────────────

function NotifShimmer() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-3xl animate-pulse"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="w-12 h-12 rounded-2xl flex-shrink-0" style={{ background: 'var(--color-surface2)' }} />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 rounded w-3/4" style={{ background: 'var(--color-surface2)' }} />
                        <div className="h-2 rounded w-1/2" style={{ background: 'var(--color-surface2)' }} />
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
    const navigate = useNavigate()
    const {
        notifications,
        notificationsLoading,
        markNotificationsRead,
        markOneNotificationRead,
        loadNotifications,
        suggestions,
        suggestionsLoading,
        loadSuggestions
    } = useFeedStore()

    const [selectedNotification, setSelectedNotification] = useState(null)
    const [followingIds, setFollowingIds] = useState(new Set())

    useEffect(() => {
        // Stagger the 3 API calls to avoid overwhelming mobile connections
        loadNotifications()
        const t1 = setTimeout(() => loadSuggestions(), 300)
        const t2 = setTimeout(() => markNotificationsRead(), 600)

        // Safety net: if backend is slow, release the loading state after 10s
        const t3 = setTimeout(() => {
            // useFeedStore will already handle this, but belt-and-suspenders
        }, 10000)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
        }
    }, [])

    const handleFollowBack = async (e, userId) => {
        e.stopPropagation()
        if (followingIds.has(userId)) return
        try {
            await followService.toggleFollow(userId)
            setFollowingIds(prev => new Set([...prev, userId]))
            loadSuggestions() // Refresh suggestions after follow
        } catch (err) {
            console.error('Follow back failed:', err)
        }
    }

    const groups = useMemo(() => groupByDate(notifications), [notifications])

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markOneNotificationRead(notification.id)
        }
        if (notification.meta?.followerId) {
            navigate(`/user/${notification.meta.followerId}`)
        } else if (notification.meta?.postId) {
            navigate(`/home?post=${notification.meta.postId}`)
        } else if (notification.sender?.id) {
            navigate(`/user/${notification.sender.id}`)
        } else {
            setSelectedNotification(notification)
        }
    }

    return (
        <div className="min-h-[100dvh] pb-24 overflow-y-auto relative" style={{ background: 'var(--color-bg)' }}>
            {/* Header */}
            <div
                className="sticky top-0 z-20 flex items-center justify-between px-4 py-5 backdrop-blur-md"
                style={{ background: 'rgba(var(--color-bg-rgb), 0.8)', borderBottom: '1px solid var(--color-border)' }}
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                        style={{ color: 'var(--color-text)', background: 'var(--color-surface2)' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>Activity</h1>
                        <p className="text-[10px] font-medium opacity-50 uppercase tracking-widest">Your notifications</p>
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <img src="/knqlogo.jpeg" alt="KnQ Logo" className="h-12 w-12 rounded-full object-cover shadow-sm opacity-80" />
                </div>
            </div>

            <div className="px-4 pt-6 space-y-6">
                {/* Who to Follow section */}
                {(suggestions.length > 0 || suggestionsLoading) && (
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 opacity-50">Suggested For You</p>
                        {suggestionsLoading ? (
                            <div className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--color-surface)' }} />
                        ) : (
                            <div className="space-y-2">
                                {suggestions.map((u) => (
                                    <SuggestionCard key={u.id} user={u} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Notification List */}
                {notificationsLoading ? (
                    <NotifShimmer />
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-30">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--color-surface2)' }}>
                            <Bell size={32} />
                        </div>
                        <p className="text-sm font-bold">All caught up!</p>
                        <p className="text-xs mt-1">No new activity to show</p>
                    </div>
                ) : (
                    groups.map(({ label, items }) => {
                        if (items.length === 0) return null
                        return (
                            <div key={label}>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-3 opacity-40">{label}</p>
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => handleNotificationClick(item)}
                                            className="group flex items-start gap-4 p-4 rounded-3xl cursor-pointer transition-all hover:bg-surface2 active:scale-[0.97] relative"
                                            style={{
                                                background: item.isRead ? 'var(--color-surface)' : 'rgba(245,158,11,0.05)',
                                                border: `1px solid ${item.isRead ? 'var(--color-border)' : 'rgba(245,158,11,0.2)'}`,
                                                boxShadow: item.isRead ? '0 8px 24px rgba(0,0,0,0.03)' : '0 4px 16px rgba(245,158,11,0.08)'
                                            }}
                                        >
                                            {/* Unread dot */}
                                            {!item.isRead && (
                                                <span className="absolute top-4 right-4 w-2 h-2 rounded-full"
                                                    style={{ background: 'var(--color-primary)' }} />
                                            )}
                                            <div
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-12 overflow-hidden"
                                                style={{
                                                    background: 'linear-gradient(135deg, var(--color-surface2), var(--color-bg))',
                                                    color: 'var(--color-primary)',
                                                    border: '1px solid var(--color-border)'
                                                }}
                                            >
                                                {item.type === 'follow' && item.sender?.avatar ? (
                                                    <img 
                                                        src={optimizeCloudinaryUrl(item.sender.avatar, { width: 100 })} 
                                                        className="w-full h-full object-cover"
                                                        alt="sender"
                                                    />
                                                ) : (
                                                    <NotifIcon type={item.type} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 py-0.5">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="font-bold text-sm pr-4 leading-snug" style={{ color: 'var(--color-text)' }}>
                                                        {item.title}
                                                    </p>
                                                    <span className="text-[10px] whitespace-nowrap font-medium opacity-40 mt-1">
                                                        {formatTime(item.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--color-muted)' }}>
                                                        {item.subtitle}
                                                    </p>
                                                    {item.type === 'follow' && item.meta?.canFollowBack && !followingIds.has(item.meta.followerId) && (
                                                        <button
                                                            onClick={(e) => handleFollowBack(e, item.meta.followerId)}
                                                            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                                                            style={{ background: 'var(--color-primary)', color: '#000' }}
                                                        >
                                                            Follow Back
                                                        </button>
                                                    )}
                                                    {followingIds.has(item.meta?.followerId) && (
                                                        <span className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider opacity-50"
                                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)' }}>
                                                            Following
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedNotification && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex flex-col pt-safe"
                        style={{ background: 'var(--color-bg)' }}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                    >
                        <div className="flex items-center gap-4 px-4 py-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <button
                                onClick={() => setSelectedNotification(null)}
                                className="p-2 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                                style={{ color: 'var(--color-text)', background: 'var(--color-surface2)' }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Notification Detail</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-10">
                            <div className="flex flex-col items-center text-center">
                                <div
                                    className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl rotate-3"
                                    style={{ background: 'linear-gradient(45deg, var(--color-primary), var(--color-primary2))', color: '#fff' }}
                                >
                                    <span className="text-4xl"><NotifIcon type={selectedNotification.type} /></span>
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--color-primary)' }}>
                                    {selectedNotification.type?.replace(/_/g, ' ') || 'Notification'}
                                </p>
                                <h3 className="text-2xl font-black mb-4 leading-tight" style={{ color: 'var(--color-text)' }}>
                                    {selectedNotification.title}
                                </h3>
                                <div className="w-12 h-1 rounded-full mb-6" style={{ background: 'var(--color-border)' }} />
                                <p className="text-base leading-relaxed mb-10" style={{ color: 'var(--color-muted)' }}>
                                    {selectedNotification.subtitle}
                                </p>
                                <div
                                    className="w-full rounded-2xl p-4 flex items-center justify-between"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                >
                                    <div className="text-left">
                                        <p className="text-[10px] uppercase font-bold opacity-40 mb-0.5">Date</p>
                                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                                            {new Date(selectedNotification.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold opacity-40 mb-0.5">Time</p>
                                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                                            {formatTime(selectedNotification.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <button
                                onClick={() => setSelectedNotification(null)}
                                className="w-full py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg"
                                style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}
                            >
                                Dismiss
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

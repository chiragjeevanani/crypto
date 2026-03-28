import { useState, useEffect } from 'react'
import { ArrowLeft, Bell, MoreHorizontal, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFeedStore } from '../store/useFeedStore'

export default function NotificationsPage() {
    const navigate = useNavigate()
    const { notifications, markNotificationsRead } = useFeedStore()
    const [selectedNotification, setSelectedNotification] = useState(null)

    // Mark as read when entering the page
    useEffect(() => {
        markNotificationsRead()
    }, [markNotificationsRead])

    const handleNotificationClick = (notification) => {
        if (notification.postId) {
            navigate(`/home?post=${notification.postId}`)
        } else if (notification.userId) {
            navigate(`/user/${notification.userId}`)
        } else {
            setSelectedNotification(notification)
        }
    }

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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
            </div>

            {/* List */}
            <div className="px-4 pt-6 space-y-4">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-30">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--color-surface2)' }}>
                            <Bell size={32} />
                        </div>
                        <p className="text-sm font-bold">All caught up!</p>
                        <p className="text-xs mt-1">No new activity to show</p>
                    </div>
                ) : (
                    notifications.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => handleNotificationClick(item)}
                            className="group flex items-start gap-4 p-4 rounded-3xl cursor-pointer transition-all hover:bg-surface2 active:scale-[0.97]"
                            style={{ 
                                background: 'var(--color-surface)', 
                                border: '1px solid var(--color-border)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.03)'
                            }}
                        >
                            <div 
                                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-12"
                                style={{ 
                                    background: 'linear-gradient(135deg, var(--color-surface2), var(--color-bg))',
                                    color: 'var(--color-primary)',
                                    border: '1px solid var(--color-border)'
                                }}
                            >
                                {item.type === 'premium_gift' ? (
                                    <span className="text-xl">🎁</span>
                                ) : item.type === 'follower_broadcast' ? (
                                    <span className="text-xl">📢</span>
                                ) : item.type === 'share' ? (
                                    <span className="text-xl">🔗</span>
                                ) : (
                                    <Bell size={20} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 py-0.5">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-bold text-sm truncate pr-2" style={{ color: 'var(--color-text)' }}>
                                        {item.title}
                                    </p>
                                    <span className="text-[10px] whitespace-nowrap font-medium opacity-40 mt-1">
                                        {formatTime(item.createdAt)}
                                    </span>
                                </div>
                                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--color-muted)' }}>
                                    {item.subtitle}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detail Overlay / Modal */}
            {selectedNotification && (
                <div 
                    className="fixed inset-0 z-[100] flex flex-col pt-safe animate-in fade-in slide-in-from-bottom-5 duration-300"
                    style={{ background: 'var(--color-bg)' }}
                >
                    <div 
                        className="flex items-center gap-4 px-4 py-5"
                        style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
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
                                style={{ 
                                    background: 'linear-gradient(45deg, var(--color-primary), var(--color-primary2))',
                                    color: '#fff'
                                }}
                            >
                                {selectedNotification.type === 'premium_gift' ? (
                                    <span className="text-4xl">🎁</span>
                                ) : selectedNotification.type === 'follower_broadcast' ? (
                                    <span className="text-4xl">📢</span>
                                ) : selectedNotification.type === 'share' ? (
                                    <span className="text-4xl">🔗</span>
                                ) : (
                                    <Bell size={40} />
                                )}
                            </div>
                            
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--color-primary)' }}>
                                {selectedNotification.type?.replace('_', ' ') || 'Notification'}
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
                                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{formatDate(selectedNotification.createdAt)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold opacity-40 mb-0.5">Time</p>
                                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{formatTime(selectedNotification.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <button 
                            onClick={() => setSelectedNotification(null)}
                            className="w-full py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg"
                            style={{ 
                                background: 'var(--color-text)', 
                                color: 'var(--color-bg)'
                            }}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

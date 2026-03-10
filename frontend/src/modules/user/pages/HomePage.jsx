import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Bell } from 'lucide-react'
import { useFeedStore } from '../store/useFeedStore'
import PostCard from '../components/feed/PostCard'
import PostFeedModal from '../components/feed/PostFeedModal'
import Stories from '../components/feed/Stories'

export default function HomePage() {
    const { posts, notifications, unreadNotifications, markNotificationsRead, loadPosts } = useFeedStore()
    useEffect(() => { loadPosts() }, [loadPosts])
    const [searchParams] = useSearchParams()
    const [query, setQuery] = useState('')
    const [showNotifications, setShowNotifications] = useState(false)
    const [postFilter, setPostFilter] = useState('all')
    const [activePostIndex, setActivePostIndex] = useState(null)
    const view = searchParams.get('view')
    const isExplore = view === 'explore'

    const feedPosts = useMemo(() => {
        if (postFilter === 'all') return posts
        return posts.filter((post) => post.postType === postFilter)
    }, [posts, postFilter])

    const filteredExplore = useMemo(() => {
        if (!query.trim()) return posts
        const q = query.toLowerCase()
        return posts.filter(
            (post) =>
                (post.caption || '').toLowerCase().includes(q) ||
                (post.creator?.username || '').toLowerCase().includes(q) ||
                (post.creator?.handle || '').toLowerCase().includes(q),
        )
    }, [posts, query])

    const openPostFeed = (postId) => {
        const idx = filteredExplore.findIndex((post) => post.id === postId)
        if (idx >= 0) setActivePostIndex(idx)
    }

    return (
        <div>
            {/* Header */}
            <div
                className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
                style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
            >
                <span className="text-xl font-extrabold" style={{ color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
                    SocialEarn
                </span>
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowNotifications((v) => !v)
                            markNotificationsRead()
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                        style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}
                    >
                        <Bell size={16} />
                        {unreadNotifications > 0 && (
                            <span className="absolute -right-1 -top-1 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                                style={{ background: 'var(--color-danger)', color: '#fff' }}>
                                {Math.min(9, unreadNotifications)}
                            </span>
                        )}
                    </button>
                    {showNotifications && (
                        <div
                            className="absolute right-0 mt-2 w-72 rounded-2xl p-3 z-20"
                            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                        >
                            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Broadcast Alerts</p>
                            {notifications.length === 0 ? (
                                <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>No premium gift alerts yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {notifications.slice(0, 4).map((item) => (
                                        <div key={item.id} className="p-2 rounded-xl" style={{ background: 'var(--color-surface2)' }}>
                                            <p className="text-[11px] font-semibold" style={{ color: 'var(--color-text)' }}>{item.title}</p>
                                            <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{item.subtitle}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Stories Section (Instagram-like) */}
            {!isExplore && <Stories />}

            {!isExplore ? (
                <div className="desktop-feed-grid">
                    <div className="mx-3 mt-3 mb-1 rounded-xl border px-2 py-2 flex gap-2 overflow-x-auto hide-scrollbar"
                        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'regular', label: 'Regular' },
                            { id: 'nft', label: 'NFT' },
                            { id: 'brand', label: 'Brand' },
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setPostFilter(filter.id)}
                                className="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer"
                                style={{
                                    background: postFilter === filter.id ? 'var(--color-primary)' : 'var(--color-surface)',
                                    color: postFilter === filter.id ? '#fff' : 'var(--color-muted)',
                                    border: `1px solid ${postFilter === filter.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                }}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                    {feedPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <div className="px-4 pt-4 pb-6">
                    <div
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4"
                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    >
                        <Search size={16} style={{ color: 'var(--color-muted)' }} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search creators, captions, trends"
                            className="w-full bg-transparent outline-none text-sm"
                            style={{ color: 'var(--color-text)' }}
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {filteredExplore.map((post) => (
                            <div
                                key={post.id}
                                className="overflow-hidden rounded-2xl"
                                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                onClick={() => openPostFeed(post.id)}
                            >
                                <img src={post.media.url} alt={post.caption} className="w-full aspect-square object-cover" />
                                <div className="p-2.5">
                                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                        {post.creator.username}
                                    </p>
                                    <p className="text-[11px] truncate" style={{ color: 'var(--color-muted)' }}>
                                        {post.caption}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom padding */}
            <div style={{ height: 16 }} />
            <PostFeedModal posts={filteredExplore} startIndex={activePostIndex} onClose={() => setActivePostIndex(null)} />
        </div>
    )
}

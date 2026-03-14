import { useMemo, useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Bell, Wallet } from 'lucide-react'
import { useFeedStore } from '../store/useFeedStore'
import { reelFeedService } from '../services/reelFeedService'
import PostCard from '../components/feed/PostCard'
import PostFeedModal from '../components/feed/PostFeedModal'
import Stories from '../components/feed/Stories'

export default function HomePage() {
    const { posts, notifications, unreadNotifications, markNotificationsRead, loadPosts } = useFeedStore()
    const navigate = useNavigate()
    useEffect(() => { loadPosts() }, [loadPosts])
    const [searchParams] = useSearchParams()
    const [query, setQuery] = useState('')
    const [showNotifications, setShowNotifications] = useState(false)
    const [postFilter, setPostFilter] = useState('all')
    const [activePostIndex, setActivePostIndex] = useState(null)
    const view = searchParams.get('view')
    const currentPostId = searchParams.get('post')
    const isExplore = view === 'explore'
    const isReels = view === 'reels'

    const feedPosts = useMemo(() => {
        if (postFilter === 'all') return posts
        if (postFilter === 'brand') {
            return posts.filter((post) => {
                if (post.postType === 'brand') return true
                const category = String(post.category || '').toLowerCase()
                return category.includes('brand') || category.includes('campaign') || category.includes('task')
            })
        }
        return posts.filter((post) => post.postType === postFilter)
    }, [posts, postFilter])

    const videoPosts = useMemo(
        () => posts.filter((post) => post.media?.type === 'video'),
        [posts],
    )
    const [reelFeed, setReelFeed] = useState([])
    const [reelFeedError, setReelFeedError] = useState('')

    const reelsStartIndex = useMemo(() => {
        if (!isReels || reelFeed.length === 0) return null
        if (!currentPostId) return 0
        const idx = reelFeed.findIndex((item) => item.id === currentPostId)
        return idx >= 0 ? idx : 0
    }, [isReels, reelFeed, currentPostId])

    useEffect(() => {
        if (!isReels) return
        let mounted = true
        const load = () => {
            reelFeedService.getFeed(6)
                .then((items) => {
                    if (mounted) {
                        setReelFeed(items || [])
                        setReelFeedError('')
                    }
                })
                .catch((err) => {
                    if (mounted) {
                        setReelFeed([])
                        setReelFeedError(err?.message || 'Failed to load reels feed')
                    }
                })
        }
        load()
        const onRefresh = () => load()
        window.addEventListener('reels-feed-refresh', onRefresh)
        return () => {
            mounted = false
            window.removeEventListener('reels-feed-refresh', onRefresh)
        }
    }, [isReels])

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

    const handleOpenFromFeed = (postId) => {
        const post = posts.find((p) => p.id === postId)
        if (post?.media?.type === 'video') {
            // Navigate into reels tab when a video is tapped from home feed
            navigate(`/home?view=reels&post=${postId}`)
        }
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
                <div className="relative flex items-center gap-2">
                    <button
                        onClick={() => navigate('/wallet')}
                        className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                        style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}
                        aria-label="Wallet"
                    >
                        <Wallet size={16} />
                    </button>
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
            {!isExplore && !isReels && <Stories />}

            {!isExplore && !isReels ? (
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
                        <PostCard key={post.id} post={post} onOpen={handleOpenFromFeed} />
                    ))}
                </div>
            ) : isExplore ? (
                <div className="px-4 pt-4 pb-6">
                    {videoPosts.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Reels</p>
                            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                                {videoPosts.slice(0, 8).map((post) => (
                                    <button
                                        key={post.id}
                                        onClick={() => navigate(`/home?view=reels&post=${post.id}`)}
                                        className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-2xl"
                                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                    >
                                        <img src={post.media.url} alt={post.caption} className="h-full w-full object-cover" />
                                        <div
                                            className="absolute inset-0 flex items-center justify-center"
                                            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.35))' }}
                                        >
                                            <div className="h-8 w-8 rounded-full flex items-center justify-center"
                                                style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}>
                                                ▸
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
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
            ) : (
                // Reels tab: content is handled by full-screen PostFeedModal below
                <div className="px-4 pt-4 pb-6">
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Reels
                    </p>
                    {reelFeed.length === 0 && !reelFeedError && (
                        <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                            No video posts yet.
                        </p>
                    )}
                    {reelFeedError && (
                        <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                            {reelFeedError}
                        </p>
                    )}
                </div>
            )}

            {/* Bottom padding */}
            <div style={{ height: 16 }} />
            {isExplore && (
                <PostFeedModal posts={filteredExplore} startIndex={activePostIndex} onClose={() => setActivePostIndex(null)} />
            )}
            {isReels && reelsStartIndex !== null && (
                <PostFeedModal
                    posts={reelFeed}
                    startIndex={reelsStartIndex}
                    onClose={() => navigate('/home', { replace: true })}
                />
            )}
        </div>
    )
}

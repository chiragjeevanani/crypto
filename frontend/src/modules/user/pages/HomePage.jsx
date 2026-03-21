import { useMemo, useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Bell, Wallet, User, MessageCircle } from 'lucide-react'
import { searchService } from '../services/searchService'
import { useFeedStore } from '../store/useFeedStore'
import { useUserStore } from '../store/useUserStore'
import { reelFeedService } from '../services/reelFeedService'
import PostCard from '../components/feed/PostCard'
import PostFeedModal from '../components/feed/PostFeedModal'
import Stories from '../components/feed/Stories'
import SuggestedUserCard from '../components/feed/SuggestedUserCard'
import SuggestedUsersSection from '../components/feed/SuggestedUsersSection'
import SuggestedReelsSection from '../components/feed/SuggestedReelsSection'
import CampaignHomeCard from '../components/feed/CampaignHomeCard'

export default function HomePage() {
    const { posts, notifications, unreadNotifications, markNotificationsRead, loadPosts } = useFeedStore()
    const { profile } = useUserStore()
    const navigate = useNavigate()
    useEffect(() => { loadPosts() }, [loadPosts])
    const [searchParams] = useSearchParams()
    const [query, setQuery] = useState('')
    const [showNotifications, setShowNotifications] = useState(false)
    const [postFilter, setPostFilter] = useState('all')
    const [activePostIndex, setActivePostIndex] = useState(null)
    const [searchUsers, setSearchUsers] = useState([])
    const [searchReels, setSearchReels] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchError, setSearchError] = useState('')
    const searchReqRef = useRef(0)
    const [suggestedUsers, setSuggestedUsers] = useState([])
    const [suggestedReels, setSuggestedReels] = useState([])
    const [suggestedLoading, setSuggestedLoading] = useState(false)
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
        setSuggestedLoading(true)
        Promise.all([
            searchService.getSuggestedUsers(),
            searchService.getSuggestedReels()
        ]).then(([users, reels]) => {
            setSuggestedUsers(users?.users || [])
            setSuggestedReels(reels?.reels || [])
        }).catch((err) => {
            console.error('Failed to fetch suggestions:', err)
        }).finally(() => {
            setSuggestedLoading(false)
        })
    }, [])

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

    useEffect(() => {
        if (!isExplore) return
        const q = query.trim()
        if (!q) {
            setSearchUsers([])
            setSearchReels([])
            setSearchLoading(false)
            setSearchError('')
            return
        }
        const handle = setTimeout(() => {
            const reqId = ++searchReqRef.current
            setSearchLoading(true)
            setSearchError('')
            searchService.search(q)
                .then((data) => {
                    if (reqId !== searchReqRef.current) return
                    setSearchUsers(Array.isArray(data.users) ? data.users : [])
                    setSearchReels(Array.isArray(data.reels) ? data.reels : [])
                })
                .catch((err) => {
                    if (reqId !== searchReqRef.current) return
                    setSearchUsers([])
                    setSearchReels([])
                    setSearchError(err?.message || 'Search failed')
                })
                .finally(() => {
                    if (reqId === searchReqRef.current) setSearchLoading(false)
                })
        }, 450)
        return () => clearTimeout(handle)
    }, [isExplore, query])

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

    useEffect(() => {
        if (!isExplore || !currentPostId) return
        const idx = filteredExplore.findIndex((post) => post.id === currentPostId)
        if (idx >= 0) setActivePostIndex(idx)
    }, [isExplore, currentPostId, filteredExplore])

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
            {!isReels && (
                <div
                    className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
                    style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
                >
                    <span className="text-xl font-extrabold" style={{ color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
                        SocialEarn
                    </span>
                    <div className="relative flex items-center gap-2">
                        <button
                            onClick={() => {
                                setQuery('')
                                navigate('/search')
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer lg:hidden"
                            style={{
                                background: 'var(--color-surface2)',
                                color: isExplore ? 'var(--color-primary)' : 'var(--color-text)',
                                border: isExplore ? '1px solid var(--color-primary)' : '1px solid transparent',
                            }}
                            aria-label="Search"
                        >
                            <Search size={16} />
                        </button>
                        <button
                            onClick={() => navigate('/wallet')}
                            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}
                            aria-label="Wallet"
                        >
                            <Wallet size={16} />
                        </button>
                        <button
                            onClick={() => navigate('/messaging')}
                            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}
                        >
                            <MessageCircle size={16} />
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
            )}

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
                    {/* If feed is empty or very short, show suggestions at the top */}
                    {(feedPosts.length === 0) && !suggestedLoading && (
                        <div className="py-2">
                             <SuggestedUsersSection />
                            {suggestedReels.length > 0 && (
                                <SuggestedReelsSection reels={suggestedReels} />
                            )}
                        </div>
                    )}

                    {feedPosts.map((post, index) => (
                        <div key={post.id}>
                            {post.postType === 'campaign_card' ? (
                                <CampaignHomeCard campaign={post.campaign} />
                            ) : (
                                <PostCard post={post} onOpen={handleOpenFromFeed} />
                            )}
                            
                            {/* Suggested Users - shown after the 2nd post (index 1) or after the 1st if it is the only post */}
                            {((index === 1) || (index === 0 && feedPosts.length === 1)) &&  <SuggestedUsersSection />}

                            {/* Suggested Reels - shown after the 5th post (index 4) or at the end if the feed is shorter than 5 */}
                            {((index === 4) || (index === feedPosts.length - 1 && feedPosts.length < 5)) && suggestedReels.length > 0 && (
                                <SuggestedReelsSection reels={suggestedReels} />
                            )}
                        </div>
                    ))}
                </div>
            ) : isExplore ? (
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

                    {query.trim() ? (
                        <div className="space-y-5">
                            {searchLoading && (
                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Searching...</p>
                            )}
                            {searchError && (
                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{searchError}</p>
                            )}

                            {searchUsers.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Accounts</p>
                                    <div className="space-y-2">
                                        {searchUsers.map((user) => (
                                            <button
                                                key={user.id}
                                                onClick={() => {
                                                    if (String(user.id) === String(profile?.id)) {
                                                        navigate('/profile')
                                                    } else {
                                                        navigate(`/user/${user.id}`)
                                                    }
                                                }}
                                                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left"
                                                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                            >
                                                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--color-surface2)' }}>
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={16} style={{ color: 'var(--color-muted)' }} />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{user.username}</p>
                                                    <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{user.handle}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {searchReels.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Reels</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {searchReels.map((post) => {
                                            if (!post) return null
                                            return (
                                                <button
                                                    key={post.id}
                                                    onClick={() => navigate(`/home?view=reels&post=${post.id}`)}
                                                    className="overflow-hidden rounded-2xl text-left"
                                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                                >
                                                    <video
                                                        src={post.media?.url}
                                                        className="w-full aspect-square object-cover"
                                                        muted
                                                        playsInline
                                                        loop
                                                        preload="metadata"
                                                        crossOrigin="anonymous"
                                                        poster={post.media?.thumbnail || post.media?.poster}
                                                    />
                                                    <div className="p-2.5">
                                                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                                            {post.creator?.username}
                                                        </p>
                                                        <p className="text-[11px] truncate" style={{ color: 'var(--color-muted)' }}>
                                                            {post.caption}
                                                        </p>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {searchReels.length === 0 && !searchLoading && (
                                <div>
                                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Suggested Reels</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {videoPosts.slice(0, 6).map((post) => {
                                            if (!post) return null
                                            return (
                                                <div
                                                    key={post.id}
                                                    className="overflow-hidden rounded-2xl"
                                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                                    onClick={() => navigate(`/home?view=reels&post=${post.id}`)}
                                                >
                                                    <div className="relative">
                                                        <video
                                                            src={post.media?.url}
                                                            className="w-full aspect-square object-cover"
                                                            muted
                                                            playsInline
                                                            loop
                                                            preload="metadata"
                                                            crossOrigin="anonymous"
                                                            poster={post.media?.thumbnail || post.media?.poster}
                                                            onMouseEnter={(e) => e.target.play().catch(() => {})}
                                                            onMouseLeave={(e) => {
                                                                e.target.pause()
                                                                e.target.currentTime = 0
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="p-2.5">
                                                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                                            {post.creator?.username}
                                                        </p>
                                                        <p className="text-[11px] truncate" style={{ color: 'var(--color-muted)' }}>
                                                            {post.caption}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {!searchLoading && searchUsers.length === 0 && searchReels.length === 0 && !searchError && (
                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No results.</p>
                            )}
                        </div>
                    ) : videoPosts.length > 0 && (
                        <div className="mb-6">
                            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Reels</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {videoPosts.slice(0, 6).map((post) => {
                                    if (!post) return null
                                    return (
                                        <div
                                            key={post.id}
                                            className="overflow-hidden rounded-2xl"
                                            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                            onClick={() => navigate(`/home?view=reels&post=${post.id}`)}
                                        >
                                            <div className="relative">
                                                <video
                                                    src={post.media?.url}
                                                    className="w-full aspect-square object-cover"
                                                    muted
                                                    playsInline
                                                    loop
                                                    preload="metadata"
                                                    crossOrigin="anonymous"
                                                    poster={post.media?.thumbnail || post.media?.poster}
                                                    onMouseEnter={(e) => e.target.play().catch(() => {})}
                                                    onMouseLeave={(e) => {
                                                        e.target.pause()
                                                        e.target.currentTime = 0
                                                    }}
                                                />
                                            </div>
                                            <div className="p-2.5">
                                                <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                                    {post.creator?.username}
                                                </p>
                                                <p className="text-[11px] truncate" style={{ color: 'var(--color-muted)' }}>
                                                    {post.caption}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {!query.trim() && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {filteredExplore.map((post) => {
                                if (!post) return null
                                return (
                                    <div
                                        key={post.id}
                                        className="overflow-hidden rounded-2xl"
                                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                        onClick={() => openPostFeed(post.id)}
                                    >
                                        {post.media?.type === 'video' ? (
                                            <video
                                                src={post.media?.url}
                                                className="w-full aspect-square object-cover"
                                                muted
                                                playsInline
                                                loop
                                                preload="metadata"
                                                crossOrigin="anonymous"
                                                poster={post.media?.thumbnail || post.media?.poster}
                                                onMouseEnter={(e) => e.target.play().catch(() => {})}
                                                onMouseLeave={(e) => {
                                                    e.target.pause()
                                                    e.target.currentTime = 0
                                                }}
                                            />
                                        ) : (
                                            <img src={post.media?.url} alt={post.caption} className="w-full aspect-square object-cover" />
                                        )}
                                        <div className="p-2.5">
                                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                                {post.creator?.username}
                                            </p>
                                            <p className="text-[11px] truncate" style={{ color: 'var(--color-muted)' }}>
                                                {post.caption}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
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
                    forceReels={true}
                />
            )}
        </div>
    )
}

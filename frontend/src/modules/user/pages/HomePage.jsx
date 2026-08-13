import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Bell, Wallet, User, MessageCircle, Gavel } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useAuctionStore } from '../../auction/store/useAuctionStore'
import { searchService } from '../services/searchService'
import { useFeedStore } from '../store/useFeedStore'
import { useUserStore } from '../store/useUserStore'
import { reelFeedService } from '../services/reelFeedService'
import PostCard from '../components/feed/PostCard'
import PostSkeleton from '../components/feed/PostSkeleton'
import ReelSkeleton from '../components/feed/ReelSkeleton'
import ReelFullSkeleton from '../components/feed/ReelFullSkeleton'
import PostFeedModal from '../components/feed/PostFeedModal'
import Stories from '../components/feed/Stories'
import SuggestedUserCard from '../components/feed/SuggestedUserCard'
import SuggestedUsersSection from '../components/feed/SuggestedUsersSection'
import SuggestedReelsSection from '../components/feed/SuggestedReelsSection'
import CampaignHomeCard from '../components/feed/CampaignHomeCard'
import LazyMount from '../components/shared/LazyMount'
import { messageService } from '../../../services/messageService'
import { getSocket } from '../../../socket'
import ErrorBoundary from '../components/shared/ErrorBoundary'
import { optimizeCloudinaryUrl } from '../../../utils/mediaOptimization'

export default function HomePage() {
    const {
        posts, postsLoading, postsHasMore, postsLoadingMore, loadMorePosts, notifications, unreadNotifications, loadNotifications, markNotificationsRead, loadPosts, fetchSinglePost,
        reelFeed, reelFeedLoading, reelFeedError, loadReelFeed, unreadTotal, setUnreadMessagesTotal
    } = useFeedStore(useShallow((s) => ({
        posts: s.posts, postsLoading: s.postsLoading, postsHasMore: s.postsHasMore, postsLoadingMore: s.postsLoadingMore,
        loadMorePosts: s.loadMorePosts, notifications: s.notifications,
        unreadNotifications: s.unreadNotifications, loadNotifications: s.loadNotifications,
        markNotificationsRead: s.markNotificationsRead, loadPosts: s.loadPosts, fetchSinglePost: s.fetchSinglePost,
        reelFeed: s.reelFeed, reelFeedLoading: s.reelFeedLoading, reelFeedError: s.reelFeedError,
        loadReelFeed: s.loadReelFeed, unreadTotal: s.unreadMessagesTotal, setUnreadMessagesTotal: s.setUnreadMessagesTotal,
    })))
    const { user, profile } = useUserStore()
    const isLanguageModalOpen = user?.role === 'User' && !user?.hasSelectedLanguages;
    const { liveAuctionCount, fetchAuctions } = useAuctionStore()
    const navigate = useNavigate()
    const loadMoreSentinelRef = useRef(null)

    useEffect(() => {
        loadPosts({ paginated: true })
        loadNotifications()
    }, [loadPosts, loadNotifications])

    useEffect(() => {
        messageService.getUnreadTotal()
            .then(setUnreadMessagesTotal)
            .catch(console.error)
    }, [setUnreadMessagesTotal])
    const [searchParams] = useSearchParams()
    const [query, setQuery] = useState('')
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
        if (postFilter === 'all') {
            return posts.filter(post => post.postType !== 'nft' && !post.isNFT)
        }
        if (postFilter === 'brand') {
            return posts.filter((post) => {
                if (post.postType === 'brand' || post.postType === 'campaign_card') return true
                const category = String(post.category || '').toLowerCase()
                return category.includes('brand') || category.includes('campaign') || category.includes('task')
            })
        }
        return posts.filter((post) => post.postType === postFilter)
    }, [posts, postFilter])

    // Infinite scroll: fetch the next page of the paginated home feed as the
    // sentinel below the last post approaches the viewport.
    useEffect(() => {
        const node = loadMoreSentinelRef.current
        if (!node || typeof IntersectionObserver === 'undefined') return undefined
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) loadMorePosts()
            },
            { rootMargin: '800px 0px' }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [loadMorePosts, feedPosts.length])

    const videoPosts = useMemo(
        () => posts.filter((post) => post.media?.type === 'video' && post.postType !== 'nft' && !post.isNFT),
        [posts],
    )

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
        
        if (reelFeed.length === 0) {
            loadReelFeed(6)
        }
        
        const onRefresh = () => loadReelFeed(6, 1)
        window.addEventListener('reels-feed-refresh', onRefresh)
        return () => {
            window.removeEventListener('reels-feed-refresh', onRefresh)
        }
    }, [isReels, loadReelFeed, reelFeed.length])

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

    useEffect(() => {
        if (!currentPostId) return
        if (isReels) {
            const idx = reelFeed.findIndex((p) => String(p.id) === String(currentPostId))
            if (idx === -1) {
                // Not in current list, fetch it
                fetchSinglePost(currentPostId)
            }
        } else {
            const idx = posts.findIndex((post) => String(post.id) === String(currentPostId))
            if (idx >= 0) {
                setActivePostIndex(idx)
            } else {
                fetchSinglePost(currentPostId).then((p) => {
                    if (p) setActivePostIndex(0)
                })
            }
        }
    }, [currentPostId, posts.length, isReels, fetchSinglePost, reelFeed.length])

    const filteredExplore = useMemo(() => {
        const nonNftPosts = posts.filter(post => post.postType !== 'nft' && !post.isNFT)
        if (!query.trim()) return nonNftPosts
        const q = query.toLowerCase()
        return nonNftPosts.filter(
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

    const handleOpenFromFeed = useCallback((postId) => {
        const post = posts.find((p) => p.id === postId)
        if (post?.media?.type === 'video') {
            // Navigate into reels tab when a video is tapped from home feed
            navigate(`/home?view=reels&post=${postId}`)
        }
    }, [posts, navigate])

    return (
        <div>
            {/* Header */}
            {!isReels && (
                <div
                    className="sticky top-0 z-50 flex items-center justify-between px-3 py-2.5"
                    style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
                >
                    <div className="flex items-center gap-1.5 min-w-0">
                        <img src="/knqlogo.jpeg" alt="KnQ Logo" className="h-9 w-9 rounded-full object-cover shrink-0" />
                        <span className="text-lg font-black shrink-0 hidden min-[375px]:inline" style={{ color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
                            Reels
                        </span>
                    </div>
                    <div className="relative flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={() => navigate('/auctions')}
                            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer lg:hidden relative"
                            style={{ 
                                background: 'rgba(244, 63, 94, 0.1)', 
                                color: 'var(--color-danger)',
                                border: '1px solid rgba(244, 63, 94, 0.3)'
                            }}
                            aria-label="Auctions"
                        >
                            <Gavel size={16} className="animate-pulse" />
                            {liveAuctionCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-bg animate-ping" />
                            )}
                        </button>
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
                            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer relative"
                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}
                        >
                            <MessageCircle size={16} />
                            {unreadTotal > 0 && (
                                <span className="absolute -right-1 -top-1 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                                    style={{ background: '#3b82f6', color: '#fff' }}>
                                    {unreadTotal}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                navigate('/notifications')
                            }}
                            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer relative transition-transform active:scale-90"
                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}
                        >
                            <Bell size={18} />
                            {unreadNotifications > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center shadow-[0_2px_8px_rgba(239,68,68,0.4)] border-2 border-[var(--color-bg)]"
                                    style={{ background: '#ef4444', color: '#fff' }}>
                                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Stories Section (Instagram-like) */}
            {!isExplore && !isReels && (
                <ErrorBoundary fallback={<div className="h-24" />}>
                    <Stories />
                </ErrorBoundary>
            )}

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
                            <ErrorBoundary>
                                <SuggestedUsersSection users={suggestedUsers} loading={suggestedLoading} />
                            </ErrorBoundary>
                            {suggestedReels.length > 0 && (
                                <ErrorBoundary>
                                    <SuggestedReelsSection reels={suggestedReels} />
                                </ErrorBoundary>
                            )}
                        </div>
                    )}

                    {postsLoading && (
                        <div className="space-y-4">
                            {[1, 2, 3].map((n) => (
                                <PostSkeleton key={n} />
                            ))}
                        </div>
                    )}
                    
                    {!postsLoading && feedPosts.length === 0 && !suggestedLoading && (
                        <div className="py-2 text-center text-muted text-sm italic">
                             No posts found.
                        </div>
                    )}

                    {feedPosts.map((post, index) => (
                        <div key={post.id}>
                            <LazyMount placeholder={<PostSkeleton />}>
                                <ErrorBoundary>
                                    {post.postType === 'campaign_card' ? (
                                        <CampaignHomeCard campaign={post.campaign} />
                                    ) : (
                                        <PostCard post={post} onOpen={handleOpenFromFeed} />
                                    )}
                                </ErrorBoundary>
                            </LazyMount>

                            {/* Suggested Users - shown after the 2nd post (index 1) or after the 1st if it is the only post */}
                            {((index === 1) || (index === 0 && feedPosts.length === 1)) && (
                                <ErrorBoundary>
                                    <SuggestedUsersSection users={suggestedUsers} loading={suggestedLoading} />
                                </ErrorBoundary>
                            )}

                            {/* Suggested Reels - shown after the 5th post (index 4) or at the end if the feed is shorter than 5 */}
                            {((index === 4) || (index === feedPosts.length - 1 && feedPosts.length < 5)) && suggestedReels.length > 0 && (
                                <ErrorBoundary>
                                    <SuggestedReelsSection reels={suggestedReels} />
                                </ErrorBoundary>
                            )}
                        </div>
                    ))}
                    {postsHasMore && (
                        <div ref={loadMoreSentinelRef} className="py-4 flex items-center justify-center">
                            {postsLoadingMore && (
                                <div className="w-5 h-5 rounded-full border-2 border-surface2 animate-spin" style={{ borderTopColor: 'var(--color-primary)' }} />
                            )}
                        </div>
                    )}
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
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[1, 2, 3, 4, 5, 6].map((n) => (
                                        <ReelSkeleton key={n} />
                                    ))}
                                </div>
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
                                                        <img src="/person.png" alt={user.username} className="w-full h-full object-cover opacity-60" />
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
                                                        src={optimizeCloudinaryUrl(post.media?.url, { isVideo: true, width: 480, quality: '50' })}
                                                        className="w-full aspect-square object-cover bg-black/10"
                                                        muted
                                                        playsInline
                                                        loop
                                                        preload="auto"
                                                        poster={post.media?.thumbnail || post.media?.poster ? optimizeCloudinaryUrl(post.media.thumbnail || post.media.poster, { width: 480, quality: '50' }) : `${optimizeCloudinaryUrl(post.media?.url)}#t=0.1`}
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
                                                            src={optimizeCloudinaryUrl(post.media?.url, { isVideo: true, width: 480, quality: '50' })}
                                                            className="w-full aspect-square object-cover"
                                                            muted
                                                            playsInline
                                                            loop
                                                            preload="auto"
                                                            poster={post.media?.thumbnail || post.media?.poster ? optimizeCloudinaryUrl(post.media.thumbnail || post.media.poster, { width: 480, quality: '50' }) : `${optimizeCloudinaryUrl(post.media?.url)}#t=0.1`}
                                                            onMouseEnter={(e) => { if (!isLanguageModalOpen) e.target.play().catch(() => {}) }}
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
                                                    src={optimizeCloudinaryUrl(post.media?.url, { isVideo: true, width: 480, quality: '50' })}
                                                    className="w-full aspect-square object-cover"
                                                    muted
                                                    playsInline
                                                    loop
                                                    preload="metadata"
                                                    poster={optimizeCloudinaryUrl(post.media?.thumbnail || post.media?.poster, { width: 480, quality: '50' })}
                                                    onMouseEnter={(e) => { if (!isLanguageModalOpen) e.target.play().catch(() => {}) }}
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
                                                src={optimizeCloudinaryUrl(post.media?.url, { isVideo: true, width: 480, quality: '50' })}
                                                className="w-full aspect-square object-cover"
                                                muted
                                                playsInline
                                                loop
                                                preload="metadata"
                                                poster={optimizeCloudinaryUrl(post.media?.thumbnail || post.media?.poster, { width: 480, quality: '50' })}
                                                onMouseEnter={(e) => { if (!isLanguageModalOpen) e.target.play().catch(() => {}) }}
                                                onMouseLeave={(e) => {
                                                    e.target.pause()
                                                    e.target.currentTime = 0
                                                }}
                                            />
                                        ) : (
                                            <img src={optimizeCloudinaryUrl(post.media?.url, { width: 480, quality: '50' })} alt={post.caption} className="w-full aspect-square object-cover" />
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
                    {reelFeedLoading ? (
                        <div className="fixed inset-0 z-50 bg-black">
                            <ReelFullSkeleton />
                        </div>
                    ) : reelFeed.length === 0 && !reelFeedError ? (
                        <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                            No video posts yet.
                        </p>
                    ) : reelFeedError && (
                        <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                            {reelFeedError}
                        </p>
                    )}
                </div>
            )}

            {/* Bottom padding */}
            <div style={{ height: 16 }} />
            {/* Modals for opening posts/reels */}
            {(isExplore || activePostIndex !== null) && (
                <PostFeedModal 
                    posts={filteredExplore} 
                    startIndex={activePostIndex} 
                    onClose={() => {
                        setActivePostIndex(null)
                        if (!isExplore && !isReels) {
                            // If we opened a post from a link while on Home page, clear the param on close
                            navigate('/home', { replace: true })
                        }
                    }} 
                />
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

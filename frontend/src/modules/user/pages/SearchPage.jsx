import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { searchService } from '../services/searchService'
import { postService } from '../services/postService'
import { useUserStore } from '../store/useUserStore'
import { useAdminStore } from '../../admin/store/useAdminStore'
import { SearchShimmer } from '../components/common/SearchShimmer'
import Avatar from '../components/shared/Avatar'
import { optimizeCloudinaryUrl } from '../../../utils/mediaOptimization'

export default function SearchPage() {
    const navigate = useNavigate()
    const { profile } = useUserStore()
    const { categories, loadCategories } = useAdminStore()
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [selectedSubcategory, setSelectedSubcategory] = useState(null)
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [users, setUsers] = useState([])
    const [reels, setReels] = useState([])
    const [suggestedReels, setSuggestedReels] = useState([])
    const [suggestedPosts, setSuggestedPosts] = useState([])
    const [allPosts, setAllPosts] = useState([])
    const requestIdRef = useRef(0)

    const trimmed = useMemo(() => query.trim(), [query])

    useEffect(() => {
        if (!trimmed) {
            setUsers([])
            setReels([])
            setLoading(false)
            setError('')
            return
        }

        const handle = setTimeout(() => {
            const requestId = ++requestIdRef.current
            setLoading(true)
            setError('')
            searchService.search(trimmed)
                .then((data) => {
                    if (requestId !== requestIdRef.current) return
                    setUsers(Array.isArray(data.users) ? data.users : [])
                    setReels(Array.isArray(data.reels) ? data.reels : [])
                })
                .catch((err) => {
                    if (requestId !== requestIdRef.current) return
                    setUsers([])
                    setReels([])
                    setError(err?.message || 'Search failed')
                })
                .finally(() => {
                    if (requestId === requestIdRef.current) setLoading(false)
                })
        }, 450)

        return () => clearTimeout(handle)
    }, [trimmed])

    useEffect(() => {
        loadCategories()
    }, [loadCategories])

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const res = await postService.getPosts()
                const list = Array.isArray(res?.posts) ? res.posts : []
                if (mounted) {
                    setAllPosts(list)
                }
            } catch {
                if (mounted) {
                    setAllPosts([])
                }
            }
        }
        load()
        return () => { mounted = false }
    }, [])

    const displayReels = useMemo(() => {
        let list = allPosts.filter(p => p.media?.type === 'video')
        if (selectedSubcategory) {
            list = list.filter(p => p.subcategory === selectedSubcategory)
        }
        return list.slice(0, 12)
    }, [allPosts, selectedSubcategory])

    const displayPosts = useMemo(() => {
        let list = allPosts.filter(p => p.media?.type !== 'video')
        if (selectedSubcategory) {
            list = list.filter(p => p.subcategory === selectedSubcategory)
        }
        return list.slice(0, 12)
    }, [allPosts, selectedSubcategory])

    const filteredPosts = useMemo(() => {
        if (!trimmed) return []
        const q = trimmed.toLowerCase()
        return allPosts.filter((post) =>
            (post.caption || '').toLowerCase().includes(q) ||
            (post.creator?.username || '').toLowerCase().includes(q) ||
            (post.creator?.handle || '').toLowerCase().includes(q) ||
            (post.category || '').toLowerCase().includes(q)
        ).slice(0, 12)
    }, [allPosts, trimmed])

    return (
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
                    placeholder="Search accounts, reels"
                    className="w-full bg-transparent outline-none text-sm"
                    style={{ color: 'var(--color-text)' }}
                />
            </div>

            {/* Direct Subcategory Tabs from 'Post Type' */}
            {!trimmed && (
                <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
                    <button
                        onClick={() => setSelectedSubcategory(null)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${!selectedSubcategory ? 'bg-primary border-primary text-black' : 'bg-surface border-surface text-muted'}`}
                    >
                        All
                    </button>
                    {(categories.find(c => c.name.toLowerCase() === 'post type')?.subcategories || []).map((sub) => (
                        <button
                            key={sub._id || sub.name}
                            onClick={() => setSelectedSubcategory(sub.name)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedSubcategory === sub.name ? 'bg-primary border-primary text-black' : 'bg-surface border-surface text-muted'}`}
                        >
                            {sub.name}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <SearchShimmer />
            ) : (
                <>
                    {error && (
                        <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>{error}</p>
                    )}

            {trimmed && users.length > 0 && (
                <div className="mb-6">
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Accounts</p>
                    <div className="space-y-2">
                        {users.map((user) => (
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
                                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                                    <Avatar src={user.avatar} alt={user.username} size="md" isPremium={user.isPremium} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1">
                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{user.username}</p>
                                        {user.isPremium && (
                                            <div className="w-3 h-3 rounded-full bg-orange-500 flex items-center justify-center p-0.5 shadow-sm">
                                                <Check size={9} className="text-white" strokeWidth={5} />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{user.handle}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {trimmed && (reels.length > 0 || filteredPosts.length > 0) && (
                <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Results</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[...reels, ...filteredPosts].map((post) => {
                            if (!post) return null
                            const isVideo = post.media?.type === 'video'
                            const openUrl = isVideo
                                ? `/home?view=reels&post=${post.id}`
                                : `/home?view=explore&post=${post.id}`
                            return (
                                <button
                                    key={post.id}
                                    onClick={() => navigate(openUrl)}
                                    className="overflow-hidden rounded-2xl text-left"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                >
                                    {isVideo ? (
                                        <video
                                            src={optimizeCloudinaryUrl(post.media?.url, { isVideo: true, width: 480, quality: '50' })}
                                            className="w-full aspect-square object-cover"
                                            muted
                                            playsInline
                                            loop
                                            preload="metadata"
                                            poster={optimizeCloudinaryUrl(post.media?.thumbnail || post.media?.poster, { width: 480, quality: '50' })}
                                            onMouseEnter={(e) => e.target.play().catch(() => {})}
                                            onMouseLeave={(e) => {
                                                e.target.pause()
                                                e.target.currentTime = 0
                                            }}
                                        />
                                    ) : (
                                        <img src={optimizeCloudinaryUrl(post.media?.url, { width: 480, quality: '50' })} alt={post.caption} className="w-full aspect-square object-cover" loading="lazy" />
                                    )}
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

            {!trimmed && (displayReels.length > 0 || displayPosts.length > 0) && (
                <div>
                    <p className="text-sm font-semibold mb-3 flex items-center justify-between" style={{ color: 'var(--color-text)' }}>
                        <span>{selectedCategory === 'All' ? 'Suggested for you' : `${selectedCategory} Results`}</span>
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[...displayReels, ...displayPosts].map((post) => {
                            if (!post) return null
                            const isVideo = post.media?.type === 'video'
                            const openUrl = isVideo
                                ? `/home?view=reels&post=${post.id}`
                                : `/home?view=explore&post=${post.id}`
                            return (
                                <button
                                    key={post.id}
                                    onClick={() => navigate(openUrl)}
                                    className="overflow-hidden rounded-2xl text-left border border-surface bg-surface transition-all active:scale-[0.98]"
                                >
                                    <div className="relative aspect-square">
                                        {isVideo ? (
                                            <video
                                                src={optimizeCloudinaryUrl(post.media?.url, { isVideo: true, width: 480, quality: '50' })}
                                                className="w-full h-full object-cover"
                                                muted
                                                playsInline
                                                loop
                                                preload="metadata"
                                                poster={optimizeCloudinaryUrl(post.media?.thumbnail || post.media?.poster, { width: 480, quality: '50' })}
                                            />
                                        ) : (
                                            <img src={optimizeCloudinaryUrl(post.media?.url, { width: 480, quality: '50' })} alt={post.caption} className="w-full h-full object-cover" loading="lazy" />
                                        )}
                                        {post.isBusiness && (
                                            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-blue-500/90 text-white text-[8px] font-bold uppercase rounded">Ad</div>
                                        )}
                                    </div>
                                    <div className="p-2.5">
                                        <p className="text-[10px] font-bold opacity-60 uppercase mb-1" style={{ color: 'var(--color-primary)' }}>
                                            {post.category || 'General'}
                                        </p>
                                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                            {post.creator?.username}
                                        </p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {!trimmed && displayReels.length === 0 && displayPosts.length === 0 && (
                <div className="mt-4 px-1">
                    {selectedSubcategory ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                No content found in <span className="text-primary font-bold">#{selectedSubcategory}</span> yet.
                            </p>
                            <p className="text-xs text-muted mt-1">Try another category or check back later.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-6 opacity-50">Discovering Content...</p>
                            <SearchShimmer />
                        </>
                    )}
                </div>
            )}

                    {trimmed && !loading && users.length === 0 && reels.length === 0 && !error && (
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No results.</p>
                    )}
                </>
            )}
        </div>
    )
}

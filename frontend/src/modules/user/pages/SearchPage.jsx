import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { searchService } from '../services/searchService'
import { postService } from '../services/postService'
import { useUserStore } from '../store/useUserStore'

export default function SearchPage() {
    const navigate = useNavigate()
    const { profile } = useUserStore()
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
        let mounted = true
        const load = async () => {
            try {
                const res = await postService.getPosts()
                const list = Array.isArray(res?.posts) ? res.posts : []
                const videos = list.filter((post) => post.media?.type === 'video').slice(0, 6)
                const images = list.filter((post) => post.media?.type !== 'video').slice(0, 6)
                if (mounted) {
                    setAllPosts(list)
                    setSuggestedReels(videos)
                    setSuggestedPosts(images)
                }
            } catch {
                if (mounted) {
                    setAllPosts([])
                    setSuggestedReels([])
                    setSuggestedPosts([])
                }
            }
        }
        load()
        return () => { mounted = false }
    }, [])

    const filteredPosts = useMemo(() => {
        if (!trimmed) return []
        const q = trimmed.toLowerCase()
        return allPosts.filter((post) =>
            (post.caption || '').toLowerCase().includes(q) ||
            (post.creator?.username || '').toLowerCase().includes(q) ||
            (post.creator?.handle || '').toLowerCase().includes(q)
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

            {loading && (
                <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>Searching...</p>
            )}
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
                                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--color-surface2)' }}>
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" loading="lazy" />
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
                                            src={post.media?.url}
                                            className="w-full aspect-square object-cover"
                                            muted
                                            playsInline
                                            loop
                                            preload="none"
                                            poster={post.media?.thumbnail || post.media?.poster}
                                            onMouseEnter={(e) => e.target.play().catch(() => {})}
                                            onMouseLeave={(e) => {
                                                e.target.pause()
                                                e.target.currentTime = 0
                                            }}
                                        />
                                    ) : (
                                        <img src={post.media?.url} alt={post.caption} className="w-full aspect-square object-cover" loading="lazy" />
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

            {!trimmed && (suggestedReels.length > 0 || suggestedPosts.length > 0) && (
                <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Suggested</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[...suggestedReels, ...suggestedPosts].map((post) => {
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
                                            src={post.media?.url}
                                            className="w-full aspect-square object-cover"
                                            muted
                                            playsInline
                                            loop
                                            preload="none"
                                            poster={post.media?.thumbnail || post.media?.poster}
                                            onMouseEnter={(e) => e.target.play().catch(() => {})}
                                            onMouseLeave={(e) => {
                                                e.target.pause()
                                                e.target.currentTime = 0
                                            }}
                                        />
                                    ) : (
                                        <img src={post.media?.url} alt={post.caption} className="w-full aspect-square object-cover" loading="lazy" />
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

            {trimmed && !loading && users.length === 0 && reels.length === 0 && !error && (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No results.</p>
            )}
        </div>
    )
}

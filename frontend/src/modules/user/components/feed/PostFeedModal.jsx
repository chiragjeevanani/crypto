import { useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react'
import PostCard from './PostCard'
import CampaignReelCard from './CampaignReelCard'
import { useFeedStore } from '../../store/useFeedStore'
import { useWalletStore } from '../../store/useWalletStore'
import { useUserStore } from '../../store/useUserStore'
import { triggerCoinRain } from '../shared/CoinRain'
import { playGiftSound } from '../../utils/giftSounds'
import GiftBar from './GiftBar'
import PostSplat from './PostSplat'
import { formatCurrency } from '../../utils/formatCurrency'

function ReelPost({ post }) {
    const { toggleLike, sendGift, splats, clearSplat, earningsByPostId } = useFeedStore()
    const { addGiftEarning, spendGiftFromSelectedWallet } = useWalletStore()
    const { profile } = useUserStore()
    const handleLike = () => {
        try {
            toggleLike(post.id)
        } catch {
            // ignore errors for now
        }
    }

    const creatorInitial = (post.creator?.username || 'U').charAt(0)
    const splat = splats[post.id]
    const earnings = earningsByPostId?.[post.id] ?? post.earnings ?? 0

    const handleGift = (gift) => {
        const spend = spendGiftFromSelectedWallet(gift.price)
        if (!spend?.ok) {
            // keep simple in reels; detailed errors handled in main feed
            return
        }
        sendGift(post.id, gift)
        playGiftSound(gift.id)
        if (post.creator.id === profile.id) addGiftEarning(gift.price)
        if (gift.price >= 5) triggerCoinRain()
    }

    return (
            <div className="relative flex flex-col h-full bg-black items-center justify-center">
            {/* Mobile: full height/width. Desktop: 9:16 with max widths. */}
            <div className="relative w-full h-full mx-auto overflow-hidden bg-black md:h-auto md:aspect-[9/16] md:max-w-[520px] lg:max-w-[560px] md:max-h-[calc(100vh-56px)]">
                <video
                    src={post.media?.url}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                />

                <AnimatePresence>
                    {splat && (
                        <PostSplat
                            key={splat.key}
                            type={splat.type}
                            onComplete={() => clearSplat(post.id)}
                        />
                    )}
                </AnimatePresence>

                {/* Right-side actions (Instagram-style) */}
                <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4 text-white">
                    <button
                        type="button"
                        onClick={handleLike}
                        className="flex flex-col items-center gap-1 cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
                            <Heart size={22} />
                        </div>
                        <span className="text-[11px] font-semibold">
                            {post.likes ?? 0}
                        </span>
                    </button>
                    <button
                        type="button"
                        className="flex flex-col items-center gap-1 cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
                            <MessageCircle size={22} />
                        </div>
                        <span className="text-[11px] font-semibold">
                            {post.comments ?? 0}
                        </span>
                    </button>
                    <button
                        type="button"
                        className="flex flex-col items-center gap-1 cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
                            <Share2 size={22} />
                        </div>
                        <span className="text-[11px] font-semibold">
                            {post.shares ?? 0}
                        </span>
                    </button>
                </div>

                {/* Bottom creator bar + gifts (gifts horizontal after profile circle) */}
                <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between gap-3">
                    {/* Profile circle + username + caption */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-white overflow-hidden flex items-center justify-center">
                            {post.creator?.avatar ? (
                                <img
                                    src={post.creator.avatar}
                                    alt={post.creator.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-sm font-bold text-black">
                                    {creatorInitial}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-white">
                                {post.creator?.username || 'User'}
                            </span>
                            <span className="text-[11px] text-white/70 truncate max-w-[140px]">
                                {post.caption || ''}
                            </span>
                            <div className="mt-2 max-w-[240px]">
                                <GiftBar postId={post.id} onGift={handleGift} compact showCounts={false} />
                            </div>
                        </div>
                    </div>
                    <div
                        className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                        style={{ background: 'rgba(245,158,11,0.18)', color: 'var(--color-primary)' }}
                    >
                        <TrendingUp size={12} />
                        {formatCurrency(earnings, profile?.currencySymbol || '₹')}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default function PostFeedModal({ posts = [], startIndex = null, onClose }) {
    const containerRef = useRef(null)
    const postRefs = useRef({})
    const itemHeightRef = useRef(0)
    const loopedPosts = useMemo(() => (posts.length > 1 ? [...posts, ...posts, ...posts] : posts), [posts])

    const isOpen = startIndex !== null && startIndex >= 0
    const isReelsMode = useMemo(() => {
        if (!posts.length) return false
        const hasTyped = posts.every((p) => p.type === 'reel' || p.type === 'campaign')
        if (hasTyped) return true
        return posts.every((p) => p.media?.type === 'video')
    }, [posts])
    const safeIndex = useMemo(() => {
        if (!isOpen) return 0
        return Math.max(0, Math.min(posts.length - 1, startIndex))
    }, [isOpen, posts.length, startIndex])

    useEffect(() => {
        if (!isOpen) return undefined
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (event) => {
            if (event.key === 'Escape') onClose?.()
        }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = prev
            window.removeEventListener('keydown', onKey)
        }
    }, [isOpen, onClose])

    useEffect(() => {
        if (!isOpen) return
        const loopIndex = posts.length > 1 ? posts.length + safeIndex : safeIndex
        const node = postRefs.current[loopIndex]
        if (node && containerRef.current) {
            node.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [isOpen, loopedPosts, safeIndex, posts.length])

    useEffect(() => {
        if (!isOpen) return
        const container = containerRef.current
        if (!container) return
        const firstItem = container.querySelector('.reels-item')
        if (firstItem) {
            itemHeightRef.current = firstItem.getBoundingClientRect().height || itemHeightRef.current
        }
    }, [isOpen, loopedPosts])

    useEffect(() => {
        if (!isOpen || posts.length <= 1) return
        const container = containerRef.current
        if (!container) return
        let lock = false
        const onScroll = () => {
            if (lock) return
            const itemHeight = itemHeightRef.current
            if (!itemHeight) return
            const loopSize = posts.length * itemHeight
            const start = loopSize
            const end = loopSize * 2
            const y = container.scrollTop
            if (y < start) {
                lock = true
                container.scrollTo({ top: y + loopSize, behavior: 'auto' })
                setTimeout(() => { lock = false }, 20)
            } else if (y >= end) {
                lock = true
                container.scrollTo({ top: y - loopSize, behavior: 'auto' })
                setTimeout(() => { lock = false }, 20)
            }
        }
        container.addEventListener('scroll', onScroll, { passive: true })
        return () => container.removeEventListener('scroll', onScroll)
    }, [isOpen, posts.length])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[65] flex flex-col md:left-[84px] lg:left-[248px] lg:right-[300px] xl:right-[332px]"
                style={{ background: 'var(--color-bg)', ['--reels-header-height']: '64px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div
                    className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 shrink-0"
                    style={{
                        background: 'var(--color-bg)',
                        borderBottom: '1px solid var(--color-border)',
                        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)'
                    }}
                >
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
                        style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {isReelsMode ? 'Reels' : 'Posts'}
                    </p>
                </div>

                <div
                    ref={containerRef}
                    className="flex-1 overflow-y-auto overflow-x-hidden px-0 py-0 md:px-0 hide-scrollbar snap-y snap-mandatory"
                    style={{
                        paddingBottom: '0px',
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    <div className="mx-auto w-full md:max-w-[460px] lg:max-w-[520px]">
                        {loopedPosts.map((post, index) => (
                            <div
                                key={`${post.id}-${index}`}
                                ref={(node) => {
                                    if (node) postRefs.current[index] = node
                                }}
                                className="snap-start snap-always shrink-0 w-full reels-item"
                            >
                                {isReelsMode
                                    ? post.type === 'campaign'
                                        ? <CampaignReelCard campaign={post} />
                                        : <ReelPost post={post} />
                                    : <PostCard post={post} />}
                            </div>
                        ))}
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    )
}

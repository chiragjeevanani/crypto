import { useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Heart, MessageCircle, Share2 } from 'lucide-react'
import PostCard from './PostCard'
import { useFeedStore } from '../../store/useFeedStore'
import { useWalletStore } from '../../store/useWalletStore'
import { useUserStore } from '../../store/useUserStore'
import { triggerCoinRain } from '../shared/CoinRain'
import { playGiftSound } from '../../utils/giftSounds'
import GiftBar from './GiftBar'

function ReelPost({ post }) {
    const { toggleLike, sendGift, splats, clearSplat } = useFeedStore()
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
            {/* Centered 9:16 video, bounded in height so it doesn’t overflow in tab/desktop view */}
            <div className="relative w-full max-w-sm mx-auto aspect-[9/16] overflow-hidden bg-black max-h-[80vh]">
                <video
                    src={post.media?.url}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                />

                {/* Right-side actions */}
                <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4 text-white">
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
                        </div>
                    </div>

                    {/* Gifts row, aligned to the right, showing cards horizontally */}
                    <div className="flex-shrink-0 max-w-[210px]">
                        <GiftBar postId={post.id} onGift={handleGift} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function PostFeedModal({ posts = [], startIndex = null, onClose }) {
    const containerRef = useRef(null)
    const postRefs = useRef({})

    const isOpen = startIndex !== null && startIndex >= 0
    const isReelsMode = useMemo(
        () => posts.length > 0 && posts.every((p) => p.media?.type === 'video'),
        [posts],
    )
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
        const targetId = posts[safeIndex]?.id
        if (!targetId) return
        const node = postRefs.current[targetId]
        if (node && containerRef.current) {
            node.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [isOpen, posts, safeIndex])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[65] flex flex-col"
                style={{ background: 'var(--color-bg)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div
                    className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 shrink-0"
                    style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
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
                        paddingBottom: 'calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 16px)',
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    <div className="mx-auto w-full max-w-[520px]">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                ref={(node) => {
                                    if (node) postRefs.current[post.id] = node
                                }}
                                className="snap-start snap-always shrink-0 w-full"
                                style={{ minHeight: 'calc(100vh - 56px)' }}
                            >
                                {isReelsMode ? <ReelPost post={post} /> : <PostCard post={post} />}
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}

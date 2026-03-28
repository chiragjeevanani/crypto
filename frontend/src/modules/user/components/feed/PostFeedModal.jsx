import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Share2, TrendingUp, Bookmark, Volume2, VolumeX, Sparkles, Music } from 'lucide-react'
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

function ReelPost({ post, active }) {
    const { toggleLike, sendGift, splats, clearSplat, earningsByPostId, savedPostIds, toggleSavePost, voteCampaignSubmission } = useFeedStore()
    const { addGiftEarning, spendGiftFromSelectedWallet } = useWalletStore()
    const { profile } = useUserStore()
    const navigate = useNavigate()
    const handleLike = () => {
        try {
            if (post.category === 'Campaign' && post.campaign && post.campaignSubmission) {
                voteCampaignSubmission(post.campaign.id || post.campaign._id, post.campaignSubmission, post.id)
            } else {
                toggleLike(post.id)
            }
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
            if (spend?.error === 'insufficient_balance') {
                navigate('/wallet')
            }
            return
        }
        sendGift(post.id, gift)
        playGiftSound(gift.id)
        if (post.creator.id === profile.id) addGiftEarning(gift.price)
        if (gift.price >= 5) triggerCoinRain()
    }

    const [isMuted, setIsMuted] = useState(true)
    const isSaved = savedPostIds.has(String(post.id))
    const [showMuteIndicator, setShowMuteIndicator] = useState(false)
    const videoRef = useRef(null)
    const audioRef = useRef(null)

    const toggleMute = () => {
        setIsMuted(!isMuted)
        setShowMuteIndicator(true)
        setTimeout(() => setShowMuteIndicator(false), 800)
    }

    useEffect(() => {
        if (!videoRef.current) return
        if (active) {
            const playVideo = videoRef.current.play()
            if (playVideo !== undefined) {
                playVideo.catch(() => { /* Autoplay block */ })
            }
            if (audioRef.current) {
                const playAudio = audioRef.current.play()
                if (playAudio !== undefined) {
                    playAudio.catch(() => {})
                }
            }
        } else {
            videoRef.current.pause()
            videoRef.current.currentTime = 0
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
            }
        }
    }, [active])

    const toggleSave = (e) => {
        e.stopPropagation()
        toggleSavePost(post.id)
    }

    return (
        <div className="relative flex flex-col h-full bg-black items-center justify-center">
            {/* Mobile: full height/width. Desktop: 9:16 with max widths. */}
            <div className="relative w-full h-full mx-auto overflow-hidden bg-black md:h-auto md:aspect-[9/16] md:max-w-[520px] lg:max-w-[560px] md:max-h-[calc(100vh-56px)]">
                <video
                    ref={videoRef}
                    src={post.media?.url}
                    className="w-full h-full object-cover cursor-pointer"
                    style={{ filter: post.filter || 'none' }}
                    loop
                    muted={isMuted}
                    playsInline
                    preload={active ? "auto" : "none"}
                    crossOrigin="anonymous"
                    onClick={toggleMute}
                />

                <AnimatePresence>
                    {showMuteIndicator && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                        >
                            <div className="bg-black/40 p-4 rounded-full text-white">
                                {isMuted ? <VolumeX size={32} /> : <Volume2 size={32} />}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                <div
                    className="absolute right-2 flex flex-col items-center gap-4 text-white"
                    style={{ bottom: 'calc(96px + var(--reels-bottom-offset, 0px))' }}
                >
                    <button
                        type="button"
                        onClick={handleLike}
                        className="flex flex-col items-center gap-1 cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
                            <Heart size={22} fill={post.isLiked ? 'currentColor' : 'none'} style={{ color: post.isLiked ? 'var(--color-danger)' : 'white' }} />
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
                        onClick={toggleSave}
                        className="flex flex-col items-center gap-1 cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
                            <Bookmark size={22} fill={isSaved ? 'white' : 'none'} />
                        </div>
                        <span className="text-[11px] font-semibold">
                            {isSaved ? 'Saved' : 'Save'}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/messaging')}
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
                <div
                    className="absolute left-3 right-3 flex items-center justify-between gap-3"
                    style={{ bottom: 'calc(12px + var(--reels-bottom-offset, 0px))' }}
                >
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
                            {post.campaign && (
                                <Link
                                    to={`/campaigns/${post.campaign.id || post.campaign._id}`}
                                    className="block mt-2 p-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md"
                                >
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <Sparkles size={11} className="text-zinc-400" />
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Related Campaign</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-bold text-white truncate max-w-[120px]">{post.campaign.title}</span>
                                        <span className="text-[9px] font-bold bg-white text-black px-2 py-0.5 rounded-full">JOIN</span>
                                    </div>
                                </Link>
                            )}
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

                    {post.musicData && (
                        <div className="absolute left-0 -bottom-8 flex items-center gap-2 overflow-hidden bg-white/10 backdrop-blur-md rounded-lg px-2 py-1 w-fit max-w-[140px]">
                            <Music size={10} className="text-white animate-spin-slow" />
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="whitespace-nowrap animate-scroll-text inline-block">
                                    <span className="text-[9px] font-bold text-white mr-4">
                                        {post.musicData.title} · {post.musicData.artist}
                                    </span>
                                    <span className="text-[9px] font-bold text-white mr-4">
                                        {post.musicData.title} · {post.musicData.artist}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {post.musicData && (
                    <audio
                        ref={audioRef}
                        src={post.musicData.audioUrl}
                        loop
                        muted={isMuted}
                        onPlay={(e) => {
                            if (post.musicStartTime) e.target.currentTime = post.musicStartTime
                        }}
                    />
                )}
            </div>
        </div>
    )
}

export default function PostFeedModal({ posts = [], startIndex = null, onClose, forceReels = false }) {
    const containerRef = useRef(null)
    const postRefs = useRef({})
    const [activeReelIndex, setActiveReelIndex] = useState(null)
    const itemHeightRef = useRef(0)
    const loopedPosts = useMemo(() => (posts.length > 1 ? [...posts, ...posts, ...posts] : posts), [posts])

    const isOpen = startIndex !== null && startIndex >= 0
    const isReelsMode = useMemo(() => {
        if (forceReels) return true
        if (!posts.length) return false
        const hasTyped = posts.every((p) => p.postType === 'brand' || p.postType === 'nft' || p.postType === 'regular')
        if (hasTyped) {
            // If it's a mix, check if they are mostly videos
            const videoCount = posts.filter(p => p.media?.type === 'video').length
            return videoCount / posts.length > 0.5
        }
        return posts.every((p) => p.media?.type === 'video')
    }, [posts, forceReels])
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
            setActiveReelIndex(loopIndex)
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
        if (!isOpen || !isReelsMode) return
        
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const ratio = entry.intersectionRatio
                    if (entry.isIntersecting && ratio > 0.6) {
                        const index = parseInt(entry.target.getAttribute('data-index'))
                        if (!isNaN(index)) {
                            setActiveReelIndex(index)
                        }
                    }
                })
            },
            {
                root: containerRef.current,
                threshold: [0, 0.5, 0.6, 0.7, 0.8, 1.0], 
            }
        )

        const container = containerRef.current
        if (container) {
            const items = container.querySelectorAll('.reels-item')
            items.forEach((item) => observer.observe(item))
        }

        return () => observer.disconnect()
    }, [isOpen, isReelsMode, loopedPosts])
    
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
                style={{
                    background: isReelsMode ? '#000' : 'var(--color-bg)',
                    '--reels-header-height': '64px',
                    '--reels-bottom-offset': 'calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 8px)',
                    '--reels-viewport-height': isReelsMode ? '100svh' : 'auto'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div
                    className={`${isReelsMode ? 'absolute top-0 left-0 right-0' : 'sticky top-0'} z-20 flex items-center gap-3 px-4 py-4 shrink-0 ${isReelsMode ? 'pointer-events-none' : ''}`}
                    style={{
                        background: isReelsMode ? 'transparent' : 'var(--color-bg)',
                        borderBottom: isReelsMode ? 'none' : '1px solid var(--color-border)',
                        paddingTop: isReelsMode ? 'calc(env(safe-area-inset-top, 0px) + 16px)' : 'calc(env(safe-area-inset-top, 0px) + 12px)'
                    }}
                >
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center cursor-pointer pointer-events-auto"
                        style={{ color: isReelsMode ? '#fff' : 'var(--color-text)' }}
                    >
                        <ArrowLeft size={isReelsMode ? 28 : 20} strokeWidth={isReelsMode ? 2.5 : 2} />
                    </button>
                    {!isReelsMode && (
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            Posts
                        </p>
                    )}
                </div>

                <div
                    ref={containerRef}
                    className="flex-1 overflow-y-auto overflow-x-hidden px-0 py-0 md:px-0 hide-scrollbar snap-y snap-mandatory"
                    style={{
                        paddingBottom: isReelsMode ? 0 : 'var(--reels-bottom-offset)',
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
                                    data-index={index}
                                >
                                {isReelsMode
                                    ? post?.type === 'campaign'
                                        ? <CampaignReelCard campaign={post} />
                                        : <ReelPost post={post} active={activeReelIndex === index} />
                                    : post && <PostCard post={post} />}
                            </div>
                        ))}
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    )
}

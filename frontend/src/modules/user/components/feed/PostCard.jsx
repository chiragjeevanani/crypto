import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Heart, MessageCircle, Share2, TrendingUp, UserPlus, Check, BriefcaseBusiness, Link2, Send, Camera, MessagesSquare, MoreHorizontal, Music, Bookmark, Volume2, VolumeX, Sparkles, ChevronRight, Vote } from 'lucide-react'
import { useFeedStore } from '../../store/useFeedStore'
import { useWalletStore } from '../../store/useWalletStore'
import { useUserStore } from '../../store/useUserStore'
import { triggerCoinRain } from '../shared/CoinRain'
import GiftBar from './GiftBar'
import PostSplat from './PostSplat'
import NFTBadge from '../shared/NFTBadge'
import { formatCount, formatCurrency, timeAgo } from '../../utils/formatCurrency'
import { playGiftSound } from '../../utils/giftSounds'

const AVATAR_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f97316']

function getColor(id) {
    if (!id) return '#f59e0b'
    const idx = parseInt(String(id).replace(/\D/g, ''), 10) % AVATAR_COLORS.length
    return AVATAR_COLORS[idx] || '#f59e0b'
}

export default function PostCard({ post, onOpen }) {
    if (!post) return null
    const { 
        toggleLike, sendGift, toggleFollow, addComment, loadComments, 
        commentsByPostId, commentsLoading, sharePost, splats, clearSplat,
        savedPostIds, toggleSavePost 
    } = useFeedStore()
    const { addGiftEarning, spendGiftFromSelectedWallet } = useWalletStore()
    const navigate = useNavigate()
    const { profile } = useUserStore()
    const [earningsFlash, setEarningsFlash] = useState(false)
    const [giftError, setGiftError] = useState('')
    const [commentsOpen, setCommentsOpen] = useState(false)
    const [shareOpen, setShareOpen] = useState(false)
    const [commentDraft, setCommentDraft] = useState('')
    const postComments = commentsByPostId[post.id] ?? []
    const isSelfPost = post.creator?.id && profile?.id && String(post.creator.id) === String(profile.id)

    const [isMuted, setIsMuted] = useState(true)
    const isSaved = savedPostIds.has(String(post.id))
    const [showMuteIndicator, setShowMuteIndicator] = useState(false)
    const videoRef = useRef(null)
    const audioRef = useRef(null)

    const toggleMute = (e) => {
        e.stopPropagation()
        const nextMuted = !isMuted
        setIsMuted(nextMuted)
        if (audioRef.current) audioRef.current.muted = nextMuted
        setShowMuteIndicator(true)
        setTimeout(() => setShowMuteIndicator(false), 800)
    }

    useEffect(() => {
        // Observer to play/pause media when in view
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    if (videoRef.current) videoRef.current.play().catch(() => {})
                    if (audioRef.current) {
                        audioRef.current.currentTime = post.musicStartTime || 0
                        audioRef.current.play().catch(() => {})
                    }
                } else {
                    if (videoRef.current) videoRef.current.pause()
                    if (audioRef.current) audioRef.current.pause()
                }
            },
            { threshold: 0.5 }
        )
        const target = videoRef.current || audioRef.current
        if (target) observer.observe(target)
        return () => observer.disconnect()
    }, [post.id, post.musicStartTime])

    useEffect(() => {
        if (commentsOpen && post.id) loadComments(post.id)
    }, [commentsOpen, post.id, loadComments])

    const splat = splats[post.id]

    const handleGift = (gift) => {
        const spend = spendGiftFromSelectedWallet(gift.price)
        if (!spend?.ok) {
            setGiftError(spend?.message || 'Insufficient balance.')
            setTimeout(() => {
                setGiftError('')
                if (spend?.error === 'insufficient_balance') {
                    navigate('/wallet')
                }
            }, 1200)
            return
        }
        sendGift(post.id, gift)
        playGiftSound(gift.id)
        if (post.creator?.id === profile?.id) addGiftEarning(gift.price)
        setGiftError('')
        setEarningsFlash(true)
        setTimeout(() => setEarningsFlash(false), 600)
        if (gift.price >= 5) triggerCoinRain()
    }

    const avatarColor = getColor(post.creator?.id || '0')
    const isNFTPost = post.postType === 'nft'
    const isBrandPost = post.postType === 'brand'

    const handleAddComment = async () => {
        const text = commentDraft.trim()
        if (!text) return
        try {
            await addComment(post.id, text)
            setCommentDraft('')
        } catch {
            // error already handled by store or could show toast
        }
    }

    const handleShare = async (channel) => {
        sharePost(post.id, channel)
        const shareLink = `${window.location.origin}/home?post=${post.id}`
        const shareText = `${post.creator?.username || 'User'}'s post on SocialEarn`

        if (channel === 'copy_link' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(shareLink)
            } catch {
                // keep UI functional even if clipboard fails
            }
        }
        if (channel === 'whatsapp') {
            const text = encodeURIComponent(`${shareText}\n${shareLink}`)
            window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
        }
        if (channel === 'telegram') {
            const text = encodeURIComponent(shareText)
            window.open(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${text}`, '_blank', 'noopener,noreferrer')
        }
        if (channel === 'instagram_story' || channel === 'instagram_dm') {
            if (typeof navigator !== 'undefined' && navigator.share) {
                try {
                    await navigator.share({ title: 'SocialEarn', text: shareText, url: shareLink })
                } catch {
                    // ignore cancellation
                }
            } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                try {
                    await navigator.clipboard.writeText(shareLink)
                } catch {
                    // keep UI functional even if clipboard fails
                }
            }
        }
        if (channel === 'more' && typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ title: 'SocialEarn', text: shareText, url: shareLink })
            } catch {
                // ignore cancellation
            }
        }
        setShareOpen(false)
    }

    const handleCTAClick = (e) => {
        e.stopPropagation()
        if (post.redirectType === 'whatsapp' && post.whatsappNumber) {
            const number = post.whatsappNumber.replace(/\D/g, '')
            const text = encodeURIComponent("I am interested in your product")
            window.open(`https://wa.me/${number}?text=${text}`, '_blank')
        } else if (post.redirectType === 'internal') {
            console.log("Redirect to internal messaging")
            // Logic for future internal messaging
        }
    }

    return (
        <article
            className={`post-card-shell mb-4 overflow-hidden transition-all duration-200 ease-out lg:mb-6 relative ${post.campaign ? 'border-2 rounded-[28px]' : ''}`}
            style={{ 
                background: 'var(--color-surface)',
                borderColor: post.campaign ? 'rgba(99,102,241,0.4)' : 'transparent',
                boxShadow: post.campaign ? '0 12px 24px -10px rgba(99,102,241,0.15)' : 'none'
            }}
        >
            {post.campaign && (
                <div className="absolute top-3 right-3 z-10 p-1 rounded-full bg-indigo-500 shadow-lg scale-90">
                    <Sparkles size={14} className="text-white" />
                </div>
            )}
            {/* Creator row */}
            <div className="flex items-start gap-3 px-4 pt-5 pb-4 lg:px-5 lg:pt-5 lg:pb-4">
                {/* Avatar */}
                <Link
                    to={isSelfPost ? '/profile' : `/user/${post.creator?.id || ''}`}
                    className="cursor-pointer"
                >
                    <div
                        className="w-10 h-10 lg:w-11 lg:h-11 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 text-white text-base font-bold shadow-md"
                        style={{ background: avatarColor }}
                    >
                        {post.creator?.avatar ? (
                            <img
                                src={post.creator.avatar}
                                alt={post.creator.username}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                        ) : (
                            post.creator?.username?.charAt(0) || 'U'
                        )}
                    </div>
                </Link>
                <div className="flex-1 min-w-0">
                    <Link
                        to={isSelfPost ? '/profile' : `/user/${post.creator?.id || ''}`}
                        className="cursor-pointer"
                    >
                        <p className="text-sm lg:text-[15px] font-bold truncate hover:text-[var(--desktop-accent,var(--color-primary))] transition-colors" style={{ color: 'var(--color-text)' }}>
                            {post.creator?.username || 'User'}
                        </p>
                    </Link>
                    <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                        {post.creator?.handle || '@user'} · {timeAgo(post.createdAt)}
                    </p>
                    {isNFTPost && (
                        <div className="mt-1.5">
                            <NFTBadge
                                status={post.isLiked ? 'sold' : 'listed'}
                                price={post.earnings}
                                className="hidden lg:inline-flex nft-badge-glow"
                            />
                        </div>
                    )}
                    {isBrandPost && (
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ background: 'rgba(245,158,11,0.14)', color: 'var(--color-primary)' }}>
                            <BriefcaseBusiness size={10} />
                            Brand Task Post
                        </div>
                    )}
                    {post.isBusiness && (
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ background: 'rgba(59,130,246,0.14)', color: 'var(--color-blue)' }}>
                            <TrendingUp size={10} />
                            Sponsored
                        </div>
                    )}
                    {post.campaign && (
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ background: 'rgba(99,102,241,0.14)', color: 'var(--desktop-accent,var(--color-primary))' }}>
                            <Sparkles size={10} className="text-indigo-400" />
                            Campaign Entry
                        </div>
                    )}
                </div>
                {!isSelfPost && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleFollow(post.creator?.id)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer flex-shrink-0 transition-all duration-200"
                        style={
                            post.creator?.isFollowing
                                ? { background: 'var(--color-surface2)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }
                                : { background: 'transparent', color: 'var(--desktop-accent,var(--color-primary))', border: '1px solid var(--desktop-accent,var(--color-primary))' }
                        }
                    >
                        {post.creator?.isFollowing ? (
                            <><Check size={12} strokeWidth={3} /> Following</>
                        ) : (
                            <><UserPlus size={12} strokeWidth={3} /> Follow</>
                        )}
                    </motion.button>
                )}
            </div>

            <div
                className={`w-full relative bg-black/5 ${onOpen ? 'cursor-pointer' : ''}`}
                style={{ aspectRatio: post.media?.type === 'audio' ? 'auto' : '4/5' }}
                onClick={() => onOpen?.(post.id)}
            >
                {post.media?.type === 'video' ? (
                    <div className="w-full h-full relative" onClick={toggleMute}>
                        {post.musicData?.audioUrl && (
                            <audio 
                                ref={audioRef}
                                src={post.musicData.audioUrl}
                                loop
                                muted={isMuted}
                                className="hidden"
                            />
                        )}
                        <video
                            ref={videoRef}
                            src={post.media?.url}
                            className="w-full h-full object-cover"
                            style={{ filter: post.filter || 'none' }}
                            loop
                            playsInline
                            muted={isMuted}
                            preload="none"
                            poster={post.media?.thumbnail || post.media?.poster}
                            crossOrigin="anonymous"
                            onError={(e) => { e.target.style.background = 'var(--color-surface2)' }}
                        />
                        <AnimatePresence>
                            {showMuteIndicator && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                                >
                                    <div className="bg-black/40 p-3 rounded-full text-white">
                                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : post.media?.type === 'audio' ? (
                    <div className="w-full p-4 flex items-center gap-3" style={{ background: 'var(--color-surface2)' }}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary)', color: '#000' }}>
                            <Music size={24} />
                        </div>
                        <audio src={post.media?.url} controls className="flex-1 min-w-0" />
                    </div>
                ) : (
                    <div className="w-full h-full relative" onClick={toggleMute}>
                        {post.musicData?.audioUrl && (
                            <audio 
                                ref={audioRef}
                                src={post.musicData.audioUrl}
                                loop
                                muted={isMuted}
                                className="hidden"
                            />
                        )}
                        <img
                            src={post.media?.url}
                            alt="post media"
                            className="w-full h-full object-cover"
                            style={{ filter: post.filter || 'none' }}
                            loading="lazy"
                            onError={(e) => { e.target.style.background = 'var(--color-surface2)' }}
                        />
                        <AnimatePresence>
                            {showMuteIndicator && post.musicData && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                                >
                                    <div className="bg-black/40 p-3 rounded-full text-white">
                                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {post.musicData && (
                            <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1.5 border border-white/10 max-w-[140px]">
                                <Music size={10} className="text-primary animate-pulse" />
                                <span className="text-[9px] font-bold text-white truncate">{post.musicData.title}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Enhanced Animations Overlay */}
                <AnimatePresence>
                    {splat && (
                        <PostSplat
                            key={splat.key}
                            type={splat.type}
                            onComplete={() => clearSplat(post.id)}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Business CTA Section - Screenshot Style */}
            {post.isBusiness && post.ctaType && post.ctaType !== 'none' && (
                <div 
                    onClick={handleCTAClick}
                    className="w-full flex items-center justify-between px-5 py-3.5 cursor-pointer transition-all active:brightness-90 hover:brightness-105"
                    style={{ 
                        background: '#e11d48', // Prominent Red like the screenshot
                        color: '#fff',
                    }}
                >
                    <span className="font-bold text-[13px] tracking-tight">{post.ctaType}</span>
                    <ChevronRight size={18} strokeWidth={3} />
                </div>
            )}

            {/* Actions & Stats Bar */}
            <div className="flex items-center gap-5 lg:gap-6 px-4 lg:px-5 pt-4 lg:pt-5 pb-2 lg:pb-3">
                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => {
                        if (post.category === 'Campaign' && post.campaign && post.campaignSubmission) {
                            voteCampaignSubmission(post.campaign.id || post.campaign._id, post.campaignSubmission, post.id)
                        } else {
                            toggleLike(post.id)
                        }
                    }}
                    className="flex items-center gap-1.5 cursor-pointer transition-transform duration-200 ease-out hover:scale-[1.03]"
                >
                    {(post.category === 'Campaign' && post.campaignSubmission) ? (
                        <Vote
                            size={23}
                            strokeWidth={2}
                            style={{ color: (post.hasVoted || post.isLiked) ? 'var(--color-primary)' : 'var(--color-muted)' }}
                        />
                    ) : (
                        <Heart
                            size={23}
                            strokeWidth={post.isLiked ? 0 : 2}
                            fill={post.isLiked ? 'var(--color-danger)' : 'transparent'}
                            style={{ color: post.isLiked ? 'var(--color-danger)' : 'var(--color-muted)' }}
                        />
                    )}
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                        {formatCount((post.category === 'Campaign' && post.campaignSubmission) ? (post.votes || post.likes || 0) : post.likes)}
                    </span>
                    {(post.category === 'Campaign' && post.campaignSubmission) && (
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-0.5" style={{ color: 'var(--color-primary)' }}>Vote</span>
                    )}
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                        e.stopPropagation()
                        setCommentsOpen(true)
                    }}
                    className="flex items-center gap-1.5 cursor-pointer transition-transform duration-200 ease-out hover:scale-[1.03]"
                >
                    <MessageCircle size={23} strokeWidth={2} style={{ color: 'var(--color-muted)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                        {formatCount(post.comments)}
                    </span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                        e.stopPropagation()
                        setShareOpen(true)
                    }}
                    className="flex items-center gap-1.5 cursor-pointer transition-transform duration-200 ease-out hover:scale-[1.03]"
                >
                    <Share2 size={23} strokeWidth={2} style={{ color: 'var(--color-muted)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                        {formatCount(post.shares)}
                    </span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                        e.stopPropagation()
                        toggleSavePost(post.id)
                    }}
                    className="flex items-center gap-1.5 cursor-pointer transition-transform duration-200 ease-out hover:scale-[1.03]"
                >
                    <Bookmark
                        size={23}
                        strokeWidth={2}
                        fill={isSaved ? 'var(--color-text)' : 'transparent'}
                        style={{ color: isSaved ? 'var(--color-text)' : 'var(--color-muted)' }}
                    />
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                        {isSaved ? 'Saved' : 'Save'}
                    </span>
                </motion.button>

                {/* Earnings badge */}
                <div
                    className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'rgba(99,102,241,0.10)' }}
                >
                    <TrendingUp size={15} style={{ color: 'var(--desktop-accent,var(--color-primary))' }} strokeWidth={2.5} />
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={post.earnings}
                            initial={{ y: -8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 8, opacity: 0 }}
                            transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
                            className="text-sm font-black"
                            style={{ color: earningsFlash ? 'var(--color-success)' : 'var(--desktop-accent,var(--color-primary))' }}
                        >
                            {formatCurrency(post.earnings, profile?.currencySymbol || '₹')}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>

            {/* Caption */}
            <div className="px-4 lg:px-5 pb-4">
                <p className="text-sm" style={{ color: 'var(--color-text)', lineHeight: '1.6' }}>
                    <span className="font-bold mr-2">{post.creator?.username || 'User'}</span>
                    <span style={{ color: 'var(--color-sub)' }}>{post.caption}</span>
                </p>
                {post.musicData && (
                    <div className="mt-2.5 flex items-center gap-2 overflow-hidden px-1">
                        <div className="flex-shrink-0 animate-spin-slow">
                            <Music size={12} className="text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="whitespace-nowrap animate-scroll-text inline-block">
                                <span className="text-[11px] font-medium text-zinc-500 mr-4">
                                    {post.musicData.title} · {post.musicData.artist}
                                </span>
                                <span className="text-[11px] font-medium text-zinc-500 mr-4">
                                    {post.musicData.title} · {post.musicData.artist}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                {post.campaign && (
                    <div className="mt-3 p-3 rounded-2xl flex items-center justify-between gap-3"
                        style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Related Campaign</p>
                            <p className="text-xs font-bold truncate mt-0.5" style={{ color: 'var(--color-text)' }}>{post.campaign.title}</p>
                            <p className="text-[10px] opacity-70 truncate">{post.campaign.brandName} · {post.campaign.rewardDetails}</p>
                        </div>
                        <Link
                            to={`/campaigns/${post.campaign.id || post.campaign._id}`}
                            className="px-3 py-1.5 rounded-full text-[11px] font-bold flex-shrink-0"
                            style={{ background: 'var(--color-primary)', color: '#fff' }}
                        >
                            Join & Vote
                        </Link>
                    </div>
                )}
            </div>

            {/* Gift interaction area */}
            <div className="px-4 lg:px-5 pt-2 lg:pt-3 pb-5 lg:pb-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                {post.allowGifts !== false && !isSelfPost ? (
                    <>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                                Gift the creator
                            </span>
                        </div>
                        <GiftBar postId={post.id} onGift={handleGift} />
                        {giftError && (
                            <p className="mt-2 text-[11px] font-medium" style={{ color: 'var(--color-danger)' }}>
                                {giftError}
                            </p>
                        )}
                    </>
                ) : post.allowGifts === false ? (
                    <div className="text-xs font-medium rounded-xl px-3 py-2" style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)' }}>
                        Gifts are disabled for brand task posts. Earn via task participation and voting.
                    </div>
                ) : null}
            </div>

            {typeof document !== 'undefined' && createPortal(
                <>
                    <AnimatePresence>
                        {commentsOpen && (
                            <motion.div
                                className="fixed inset-0 z-[120] flex flex-col justify-end"
                                style={{ background: 'rgba(0,0,0,0.55)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setCommentsOpen(false)}
                            >
                                <motion.div
                                    className="rounded-t-3xl px-4 pt-4 pb-5 max-h-[70vh] overflow-y-auto"
                                    style={{ background: 'var(--color-surface)' }}
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    transition={{ duration: 0.22, ease: 'easeOut' }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex justify-center mb-4">
                                        <div className="w-10 h-1 rounded-full bg-zinc-700/50" />
                                    </div>
                                    <p className="text-sm font-bold mb-3" style={{ color: 'var(--color-text)' }}>Comments</p>
                                    <div className="space-y-2 mb-3">
                                        {commentsLoading[post.id] ? (
                                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Loading...</p>
                                        ) : postComments.length === 0 ? (
                                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No comments yet.</p>
                                        ) : (
                                            postComments.map((item) => (
                                                <div key={item.id} className="p-2.5 rounded-lg" style={{ background: 'var(--color-surface2)' }}>
                                                    <p className="text-[11px] font-semibold" style={{ color: 'var(--color-text)' }}>{item.author?.handle || item.author?.name || 'User'}</p>
                                                    <p className="text-xs" style={{ color: 'var(--color-sub)' }}>{item.text}</p>
                                                    {item.createdAt && <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>{timeAgo(item.createdAt)}</p>}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={commentDraft}
                                            onChange={(e) => setCommentDraft(e.target.value)}
                                            placeholder="Add a comment..."
                                            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            className="px-3 py-2 rounded-lg text-xs font-bold cursor-pointer"
                                            style={{ background: 'var(--color-primary)', color: '#fff' }}
                                        >
                                            Post
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {shareOpen && (
                            <motion.div
                                className="fixed inset-0 z-[120] flex flex-col justify-end"
                                style={{ background: 'rgba(0,0,0,0.55)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShareOpen(false)}
                            >
                                <motion.div
                                    className="rounded-t-3xl px-4 pt-4 pb-8"
                                    style={{ background: 'var(--color-surface)' }}
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    transition={{ duration: 0.22, ease: 'easeOut' }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex justify-center mb-4">
                                        <div className="w-10 h-1 rounded-full bg-zinc-700/50" />
                                    </div>
                                    <p className="text-sm font-bold mb-4" style={{ color: 'var(--color-text)' }}>Share Post</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => handleShare('copy_link')}
                                            className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-[11px] font-semibold cursor-pointer"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        >
                                            <Link2 size={16} />
                                            Copy
                                        </button>
                                        <button
                                            onClick={() => handleShare('whatsapp')}
                                            className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-[11px] font-semibold cursor-pointer"
                                            style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.35)' }}
                                        >
                                            <MessageCircle size={16} />
                                            WhatsApp
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigate('/messaging', { state: { sharePost: post } });
                                                setShareOpen(false);
                                            }}
                                            className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-[11px] font-semibold cursor-pointer"
                                            style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.35)' }}
                                        >
                                            <Send size={16} />
                                            Message
                                        </button>
                                        <button
                                            onClick={() => handleShare('instagram_story')}
                                            className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-[11px] font-semibold cursor-pointer"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        >
                                            <Camera size={16} />
                                            Story
                                        </button>
                                        <button
                                            onClick={() => handleShare('instagram_dm')}
                                            className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-[11px] font-semibold cursor-pointer"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        >
                                            <MessagesSquare size={16} />
                                            IG DM
                                        </button>
                                        <button
                                            onClick={() => handleShare('telegram')}
                                            className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-[11px] font-semibold cursor-pointer"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        >
                                            <Send size={16} />
                                            Telegram
                                        </button>
                                        <button
                                            onClick={() => handleShare('more')}
                                            className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-[11px] font-semibold cursor-pointer"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        >
                                            <MoreHorizontal size={16} />
                                            More
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>,
                document.body
            )}
        </article>
    )
}

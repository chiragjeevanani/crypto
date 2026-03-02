import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Heart, MessageCircle, Share2, TrendingUp, UserPlus, Check, BriefcaseBusiness } from 'lucide-react'
import { useFeedStore } from '../../store/useFeedStore'
import { useWalletStore } from '../../store/useWalletStore'
import { useUserStore } from '../../store/useUserStore'
import { triggerCoinRain } from '../shared/CoinRain'
import GiftBar from './GiftBar'
import PostSplat from './PostSplat'
import NFTBadge from '../shared/NFTBadge'
import { formatCount, formatINR, timeAgo } from '../../utils/formatCurrency'

const AVATAR_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f97316']

function getColor(id) {
    const idx = parseInt(id.replace(/\D/g, ''), 10) % AVATAR_COLORS.length
    return AVATAR_COLORS[idx] || '#f59e0b'
}

export default function PostCard({ post, onOpen }) {
    const { toggleLike, sendGift, toggleFollow, addComment, sharePost, splats, clearSplat } = useFeedStore()
    const { addGiftEarning, spendGiftFromSelectedWallet } = useWalletStore()
    const { profile } = useUserStore()
    const [earningsFlash, setEarningsFlash] = useState(false)
    const [giftError, setGiftError] = useState('')
    const [commentsOpen, setCommentsOpen] = useState(false)
    const [shareOpen, setShareOpen] = useState(false)
    const [commentDraft, setCommentDraft] = useState('')
    const [localComments, setLocalComments] = useState([
        { id: `cmt_${post.id}_1`, user: 'creator_fan', text: 'Amazing content!' },
        { id: `cmt_${post.id}_2`, user: 'daily_viewer', text: 'Loved this post.' },
    ])

    const splat = splats[post.id]

    const handleGift = (gift) => {
        const spend = spendGiftFromSelectedWallet(gift.price)
        if (!spend?.ok) {
            setGiftError(spend?.message || 'Unable to send gift.')
            setTimeout(() => setGiftError(''), 1800)
            return
        }
        sendGift(post.id, gift)
        if (post.creator.id === profile.id) addGiftEarning(gift.price)
        setGiftError('')
        setEarningsFlash(true)
        setTimeout(() => setEarningsFlash(false), 600)
        if (gift.price >= 5) triggerCoinRain()
    }

    const avatarColor = getColor(post.creator.id)
    const isNFTPost = post.postType === 'nft'
    const isBrandPost = post.postType === 'brand'

    const handleAddComment = () => {
        const text = commentDraft.trim()
        if (!text) return
        addComment(post.id, text)
        setLocalComments((prev) => [...prev, { id: `cmt_${Date.now()}`, user: 'you', text }])
        setCommentDraft('')
    }

    const handleShare = async (channel) => {
        sharePost(post.id, channel)
        if (channel === 'copy_link' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(`${window.location.origin}/home?post=${post.id}`)
            } catch {
                // keep UI functional even if clipboard fails
            }
        }
        setShareOpen(false)
    }

    return (
        <article
            className="post-card-shell mb-4 overflow-hidden transition-all duration-200 ease-out lg:mb-6"
            style={{ background: 'var(--color-surface)' }}
        >
            {/* Creator row */}
            <div className="flex items-start gap-3 px-4 pt-5 pb-4 lg:px-5 lg:pt-5 lg:pb-4">
                {/* Avatar */}
                <Link to={`/user/${post.creator.id}`} className="cursor-pointer">
                    <div
                        className="w-10 h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white text-base font-bold shadow-md"
                        style={{ background: avatarColor }}
                    >
                        {post.creator.username.charAt(0)}
                    </div>
                </Link>
                <div className="flex-1 min-w-0">
                    <Link to={`/user/${post.creator.id}`} className="cursor-pointer">
                        <p className="text-sm lg:text-[15px] font-bold truncate hover:text-[var(--desktop-accent,var(--color-primary))] transition-colors" style={{ color: 'var(--color-text)' }}>
                            {post.creator.username}
                        </p>
                    </Link>
                    <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                        {post.creator.handle} · {timeAgo(post.createdAt)}
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
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleFollow(post.creator.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer flex-shrink-0 transition-all duration-200"
                    style={
                        post.creator.isFollowing
                            ? { background: 'var(--color-surface2)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }
                            : { background: 'transparent', color: 'var(--desktop-accent,var(--color-primary))', border: '1px solid var(--desktop-accent,var(--color-primary))' }
                    }
                >
                    {post.creator.isFollowing ? (
                        <><Check size={12} strokeWidth={3} /> Following</>
                    ) : (
                        <><UserPlus size={12} strokeWidth={3} /> Follow</>
                    )}
                </motion.button>
            </div>

            {/* Media */}
            <div
                className={`w-full relative bg-black/5 ${onOpen ? 'cursor-pointer' : ''}`}
                style={{ aspectRatio: '4/3' }}
                onClick={() => onOpen?.(post.id)}
            >
                <img
                    src={post.media.url}
                    alt="post media"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { e.target.style.background = 'var(--color-surface2)' }}
                />

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

            {/* Actions & Stats Bar */}
            <div className="flex items-center gap-5 lg:gap-6 px-4 lg:px-5 pt-4 lg:pt-5 pb-2 lg:pb-3">
                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => toggleLike(post.id)}
                    className="flex items-center gap-1.5 cursor-pointer transition-transform duration-200 ease-out hover:scale-[1.03]"
                >
                    <Heart
                        size={23}
                        strokeWidth={post.isLiked ? 0 : 2}
                        fill={post.isLiked ? 'var(--color-danger)' : 'transparent'}
                        style={{ color: post.isLiked ? 'var(--color-danger)' : 'var(--color-muted)' }}
                    />
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                        {formatCount(post.likes)}
                    </span>
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
                            {formatINR(post.earnings)}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>

            {/* Caption */}
            <div className="px-4 lg:px-5 pb-4">
                <p className="text-sm" style={{ color: 'var(--color-text)', lineHeight: '1.6' }}>
                    <span className="font-bold mr-2">{post.creator.username}</span>
                    <span style={{ color: 'var(--color-sub)' }}>{post.caption}</span>
                </p>
                <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ background: 'rgba(99,102,241,0.07)' }}>
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                        Earnings Summary
                    </span>
                    <span className="text-sm font-bold" style={{ color: 'var(--desktop-accent,var(--color-primary))' }}>
                        {formatINR(post.earnings)}
                    </span>
                </div>
            </div>

            {/* Gift interaction area */}
            <div className="px-4 lg:px-5 pt-2 lg:pt-3 pb-5 lg:pb-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                {post.allowGifts !== false ? (
                    <>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                                Support this creator
                            </span>
                        </div>
                        <GiftBar postId={post.id} onGift={handleGift} />
                        {giftError && (
                            <p className="mt-2 text-[11px] font-medium" style={{ color: 'var(--color-danger)' }}>
                                {giftError}
                            </p>
                        )}
                    </>
                ) : (
                    <div className="text-xs font-medium rounded-xl px-3 py-2" style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)' }}>
                        Gifts are disabled for brand task posts. Earn via task participation and voting.
                    </div>
                )}
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
                                        {localComments.map((item) => (
                                            <div key={item.id} className="p-2.5 rounded-lg" style={{ background: 'var(--color-surface2)' }}>
                                                <p className="text-[11px] font-semibold" style={{ color: 'var(--color-text)' }}>@{item.user}</p>
                                                <p className="text-xs" style={{ color: 'var(--color-sub)' }}>{item.text}</p>
                                            </div>
                                        ))}
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
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => handleShare('copy_link')}
                                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors hover:bg-zinc-800/40"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        >
                                            Copy Link
                                        </button>
                                        <button
                                            onClick={() => handleShare('whatsapp')}
                                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors hover:bg-zinc-800/40"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        >
                                            Share to WhatsApp
                                        </button>
                                        <button
                                            onClick={() => handleShare('instagram_story')}
                                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors hover:bg-zinc-800/40"
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                        >
                                            Share to Story
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

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Share2, TrendingUp, UserPlus, Check } from 'lucide-react'
import { useFeedStore } from '../../store/useFeedStore'
import { useWalletStore } from '../../store/useWalletStore'
import { triggerCoinRain } from '../shared/CoinRain'
import GiftBar from './GiftBar'
import PostSplat from './PostSplat'
import { formatCount, formatINR, timeAgo } from '../../utils/formatCurrency'

const AVATAR_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f97316']

function getColor(id) {
    const idx = parseInt(id.replace(/\D/g, ''), 10) % AVATAR_COLORS.length
    return AVATAR_COLORS[idx] || '#f59e0b'
}

export default function PostCard({ post }) {
    const { toggleLike, sendGift, toggleFollow, splats, clearSplat } = useFeedStore()
    const { addGiftEarning } = useWalletStore()
    const [earningsFlash, setEarningsFlash] = useState(false)

    const splat = splats[post.id]

    const handleGift = (gift) => {
        sendGift(post.id, gift)
        addGiftEarning(gift.price)
        setEarningsFlash(true)
        setTimeout(() => setEarningsFlash(false), 600)
        if (gift.price >= 5) triggerCoinRain()
    }

    const avatarColor = getColor(post.creator.id)

    return (
        <article
            className="mb-4 overflow-hidden"
            style={{ background: 'var(--color-surface)', borderBottom: '8px solid var(--color-surface2)' }}
        >
            {/* Creator row */}
            <div className="flex items-center gap-3 px-4 pt-5 pb-4">
                {/* Avatar */}
                <Link to={`/user/${post.creator.id}`} className="cursor-pointer">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-base font-bold shadow-md"
                        style={{ background: avatarColor }}
                    >
                        {post.creator.username.charAt(0)}
                    </div>
                </Link>
                <div className="flex-1 min-w-0">
                    <Link to={`/user/${post.creator.id}`} className="cursor-pointer">
                        <p className="text-sm font-bold truncate hover:text-[var(--color-primary)] transition-colors" style={{ color: 'var(--color-text)' }}>
                            {post.creator.username}
                        </p>
                    </Link>
                    <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                        {post.creator.handle} · {timeAgo(post.createdAt)}
                    </p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleFollow(post.creator.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer flex-shrink-0 transition-all duration-150"
                    style={
                        post.creator.isFollowing
                            ? { background: 'var(--color-surface2)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }
                            : { background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }
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
            <div className="w-full relative bg-black/5" style={{ aspectRatio: '4/3' }}>
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
            <div className="flex items-center gap-5 px-4 pt-4 pb-2">
                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => toggleLike(post.id)}
                    className="flex items-center gap-1.5 cursor-pointer"
                >
                    <Heart
                        size={22}
                        strokeWidth={post.isLiked ? 0 : 2}
                        fill={post.isLiked ? 'var(--color-danger)' : 'transparent'}
                        style={{ color: post.isLiked ? 'var(--color-danger)' : 'var(--color-muted)' }}
                    />
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                        {formatCount(post.likes)}
                    </span>
                </motion.button>

                <motion.button whileTap={{ scale: 0.8 }} className="flex items-center gap-1.5 cursor-pointer">
                    <MessageCircle size={22} strokeWidth={2} style={{ color: 'var(--color-muted)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                        {formatCount(post.comments)}
                    </span>
                </motion.button>

                <motion.button whileTap={{ scale: 0.8 }} className="flex items-center gap-1.5 cursor-pointer">
                    <Share2 size={22} strokeWidth={2} style={{ color: 'var(--color-muted)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                        {formatCount(post.shares)}
                    </span>
                </motion.button>

                {/* Earnings badge */}
                <div
                    className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(245,158,11,0.08)' }}
                >
                    <TrendingUp size={15} style={{ color: 'var(--color-primary)' }} strokeWidth={2.5} />
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={post.earnings}
                            initial={{ y: -8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 8, opacity: 0 }}
                            transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
                            className="text-sm font-black"
                            style={{ color: earningsFlash ? 'var(--color-success)' : 'var(--color-primary)' }}
                        >
                            {formatINR(post.earnings)}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>

            {/* Caption */}
            <div className="px-4 pb-4">
                <p className="text-sm" style={{ color: 'var(--color-text)', lineHeight: '1.6' }}>
                    <span className="font-bold mr-2">{post.creator.username}</span>
                    <span style={{ color: 'var(--color-sub)' }}>{post.caption}</span>
                </p>
            </div>

            {/* Gift interaction area */}
            <div className="px-4 pt-2 pb-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                        Support this creator
                    </span>
                </div>
                <GiftBar postId={post.id} onGift={handleGift} />
            </div>
        </article>
    )
}

import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Share2, MoreHorizontal, UserPlus, Check, Star } from 'lucide-react'
import { mockPosts } from '../data/mockPosts'
import { mockProfilePosts, mockNFTs } from '../data/mockNFTs'
import { useFeedStore } from '../store/useFeedStore'
import { formatCount, formatINR } from '../utils/formatCurrency'
import NFTBadge from '../components/shared/NFTBadge'

const TABS = ['Posts', 'NFTs']

const AVATAR_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f97316']

function getColor(id) {
    const idx = parseInt(id.replace(/\D/g, ''), 10) % AVATAR_COLORS.length
    return AVATAR_COLORS[idx] || '#f59e0b'
}

export default function UserProfilePage() {
    const { userId } = useParams()
    const navigate = useNavigate()
    const { toggleFollow, posts } = useFeedStore()
    const [activeTab, setActiveTab] = useState('Posts')

    // Find user in posts
    const user = useMemo(() => {
        const post = posts.find(p => p.creator.id === userId)
        if (post) return post.creator
        // Fallback or handle not found
        return {
            id: userId,
            username: 'Unknown User',
            handle: '@unknown',
            isFollowing: false
        }
    }, [userId, posts])

    // Filter posts by this user
    const userPosts = useMemo(() => {
        return mockProfilePosts.slice(0, 6) // Mocking their grid
    }, [])

    const avatarColor = getColor(userId)

    return (
        <div className="flex flex-col h-full bg-inherit">
            {/* Header / Actions */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 sticky top-0 z-10 bg-inherit pb-4"
                style={{ borderBottom: '1px solid var(--color-border)' }}>
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full cursor-pointer hover:bg-zinc-800/50">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1 px-4 truncate text-center">
                    <p className="text-base font-bold truncate">{user.username}</p>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-2 rounded-full cursor-pointer hover:bg-zinc-800/50">
                        <Share2 size={20} />
                    </button>
                    <button className="p-2 rounded-full cursor-pointer hover:bg-zinc-800/50">
                        <MoreHorizontal size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1">
                {/* Profile Info */}
                <div className="px-4 pt-6 pb-4">
                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div
                            className="flex-shrink-0 p-0.5 rounded-full"
                            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))' }}
                        >
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-xl"
                                style={{ background: avatarColor }}
                            >
                                {user.username.charAt(0)}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex-1 grid grid-cols-3 gap-2 pt-4">
                            {[
                                { label: 'Posts', value: '1.2K' },
                                { label: 'Followers', value: '48K' },
                                { label: 'Following', value: '892' },
                            ].map((stat) => (
                                <div key={stat.label} className="flex flex-col items-center">
                                    <span className="text-base font-extrabold" style={{ color: 'var(--color-text)' }}>
                                        {stat.value}
                                    </span>
                                    <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                                        {stat.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Name + Bio */}
                    <div className="mt-4">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                                {user.username}
                            </p>
                            <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--color-primary)' }}
                            >
                                <Star size={9} strokeWidth={2.5} fill="var(--color-primary)" />
                                Top Creator
                            </span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                            {user.handle}
                        </p>
                        <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-sub)' }}>
                            Digital Creator & NFT Collector. Sharing daily vibes and exclusive content. 📸✨
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-5">
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => toggleFollow(user.id)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all"
                            style={
                                user.isFollowing
                                    ? { background: 'var(--color-surface2)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }
                                    : { background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))', color: '#fff' }
                            }
                        >
                            {user.isFollowing ? (
                                <span className="flex items-center justify-center gap-1.5">
                                    <Check size={16} strokeWidth={2.5} /> Following
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-1.5">
                                    <UserPlus size={16} strokeWidth={2.5} /> Follow
                                </span>
                            )}
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                        >
                            Message
                        </motion.button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b px-4 mt-2" style={{ borderColor: 'var(--color-border)' }}>
                    {TABS.map((tab) => {
                        const active = tab === activeTab
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className="flex-1 pb-2.5 text-sm font-semibold cursor-pointer transition-colors relative"
                                style={{ color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}
                            >
                                {tab}
                                {active && (
                                    <motion.div
                                        layoutId="user-profile-tab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                        style={{ background: 'var(--color-primary)' }}
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Tab Content */}
                <div className="min-h-[300px]">
                    {activeTab === 'Posts' && (
                        <div className="grid grid-cols-3 gap-0.5 p-0.5">
                            {userPosts.map((post) => (
                                <div key={post.id} className="relative aspect-square">
                                    <img
                                        src={post.thumbnail}
                                        alt="post"
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute bottom-1 right-1">
                                        <span
                                            className="text-[9px] font-bold px-1 py-0.5 rounded-sm"
                                            style={{ background: 'rgba(245,158,11,0.9)', color: '#fff' }}
                                        >
                                            ₹{post.earnings}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'NFTs' && (
                        <div className="px-4 py-4 flex flex-col gap-3">
                            {mockNFTs.slice(0, 2).map((nft) => (
                                <div
                                    key={nft.id}
                                    className="flex items-center gap-3 p-3 rounded-2xl"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                >
                                    <img
                                        src={nft.thumbnail}
                                        alt={nft.title}
                                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                            {nft.title}
                                        </p>
                                        <NFTBadge status={nft.status} price={nft.price} className="mt-1" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

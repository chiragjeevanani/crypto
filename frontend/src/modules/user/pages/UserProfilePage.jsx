import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Share2, MoreHorizontal, UserPlus, Check, Star, X, Play, Eye, MessageCircle } from 'lucide-react'
import { formatCount } from '../utils/formatCurrency'
import { useFeedStore } from '../store/useFeedStore'
import { useUserStore, getStoredToken } from '../store/useUserStore'
import NFTBadge from '../components/shared/NFTBadge'
import PostFeedModal from '../components/feed/PostFeedModal'
import { followService } from '../services/followService'
import { searchService } from '../services/searchService'
import { postService } from '../services/postService'
import { walletService } from '../services/walletService'
import SuggestedUserCard from '../components/feed/SuggestedUserCard'
import SuggestedUsersSection from '../components/feed/SuggestedUsersSection'
import Avatar from '../components/shared/Avatar'
import { optimizeCloudinaryUrl } from '../../../utils/mediaOptimization'

const TABS = ['Posts', 'NFTs']

const AVATAR_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f97316']

function getColor(id) {
    const idx = parseInt(id.replace(/\D/g, ''), 10) % AVATAR_COLORS.length
    return AVATAR_COLORS[idx] || '#f59e0b'
}

export default function UserProfilePage() {
    const { userId } = useParams()
    const navigate = useNavigate()
    const { profile } = useUserStore()
    const { toggleFollow, posts, loadPosts } = useFeedStore()
    const [activeTab, setActiveTab] = useState('Posts')
    const [activePostIndex, setActivePostIndex] = useState(null)
    const [connectionsOpen, setConnectionsOpen] = useState(null)
    const [followers, setFollowers] = useState([])
    const [following, setFollowing] = useState([])
    const [profileUser, setProfileUser] = useState(null)
    const [profileLoading, setProfileLoading] = useState(true)
    const [nfts, setNfts] = useState([])
    const [showShareMenu, setShowShareMenu] = useState(false)
    const [deleteModalConfig, setDeleteModalConfig] = useState(null)

    useEffect(() => { loadPosts() }, [loadPosts])

    // Load user profile details and connections
    useEffect(() => {
        const id = userId
        if (!id) return
        let cancelled = false
        const load = async () => {
            setProfileLoading(true)
            try {
                const [fRes, gRes, uRes, nRes, cRes] = await Promise.all([
                    followService.getFollowers(id),
                    followService.getFollowing(id),
                    searchService.getUserById(id),
                    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/user/posts?creator=${id}&isNFT=true`, { 
                        headers: { Authorization: `Bearer ${getStoredToken()}` } 
                    }).then(r => r.json().catch(() => ({}))),
                    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/nft/user/${id}/collection`, { 
                        headers: { Authorization: `Bearer ${getStoredToken()}` } 
                    }).then(r => r.json().catch(() => ({})))
                ])
                if (cancelled) return
                setFollowers(Array.isArray(fRes.followers) ? fRes.followers : [])
                setFollowing(Array.isArray(gRes.following) ? gRes.following : [])
                if (uRes.success) {
                    setProfileUser(uRes.user)
                }
                
                // Combine created NFTs and owned NFTs
                const createdPosts = nRes.posts || [];
                const createdNfts = createdPosts.filter(p => p.postType === 'nft').map(p => ({
                    ...p,
                    status: p.status === 'approved' ? 'listed' : p.status,
                    isOwned: false,
                    isNFT: true,
                    collectibleId: p.id, // Fallback for collectibleId for created NFTs
                    thumbnail: p.media?.url || p.thumbnail,
                    title: p.caption || 'Created NFT',
                    nftPriceINR: p.nftPriceINR || 0
                }));
                const ownedNfts = (cRes.nfts || []).map(o => ({
                    id: o.auctionId || o.collectibleId || Math.random().toString(),
                    collectibleId: o.collectibleId,
                    creator: {
                        id: o.creator?._id || o.creator?.id || uRes.user?.id || id,
                        username: o.creator?.name || uRes.user?.fullName || uRes.user?.username || 'User',
                        handle: o.creator?.handle || uRes.user?.handle,
                        avatar: o.creator?.avatar || uRes.user?.avatar
                    },
                    media: { url: o.mediaUrl, type: o.mediaType },
                    caption: o.description || o.title || 'Owned NFT',
                    title: o.title || 'Owned NFT',
                    status: o.isListedForSale ? 'listed' : (o.status || 'sold'),
                    price: o.isListedForSale ? o.resalePrice : (o.salePrice || 0),
                    nftPriceINR: o.isListedForSale ? o.resalePrice : (o.salePrice || 0),
                    isListedForSale: o.isListedForSale,
                    resalePrice: o.resalePrice,
                    views: 0,
                    bids: 0,
                    thumbnail: o.mediaUrl,
                    isOwned: true,
                    isNFT: true,
                    postType: 'nft',
                    createdAt: o.acquiredAt || new Date().toISOString(),
                    likes: [],
                    comments: 0,
                    shares: 0
                }));
                
                const combined = [...createdNfts];
                for (const owned of ownedNfts) {
                    if (!combined.find(p => p.id === owned.id)) {
                        combined.push(owned);
                    }
                }
                setNfts(combined);
                setProfileLoading(false)
            } catch (err) {
                console.error("Failed to load user profile:", err)
                if (!cancelled) {
                    setFollowers([])
                    setFollowing([])
                    setProfileLoading(false)
                }
            }
        }
        load()

        const onFollowChanged = (e) => {
            // Re-fetch only if it's the current profile being viewed
            if (String(e.detail.creatorId) === String(id)) {
                load()
            }
        }
        window.addEventListener('user-follow-changed', onFollowChanged)

        return () => {
            cancelled = true
            window.removeEventListener('user-follow-changed', onFollowChanged)
        }
    }, [userId])

    // That user's posts from feed (current posts for this profile)
    const userPosts = useMemo(() => {
        return posts.filter((p) => String(p.creator?.id) === String(userId))
    }, [posts, userId])
    const totalViews = useMemo(() => userPosts.reduce((acc, p) => acc + (p.views || 0), 0), [userPosts])

    // Find user from fetched profile, then first post, or fallback
    const user = useMemo(() => {
        if (profileUser) return profileUser

        const post = posts.find((p) => String(p.creator?.id) === String(userId))
        if (post?.creator) return post.creator
        return {
            id: userId,
            username: profileLoading ? 'Loading...' : 'Unknown User',
            handle: profileLoading ? '...' : '@unknown',
            isFollowing: false,
            bio: 'Digital Creator & NFT Collector. Sharing daily vibes and exclusive content. 📸✨'
        }
    }, [userId, posts, profileUser, profileLoading])

    const avatarColor = getColor(userId)

    const handleToggleFollow = async () => {
        try {
            await toggleFollow(user.id)
            // Refresh followers/following so counts and lists stay in sync with DB
            const [fRes, gRes, uRes] = await Promise.all([
                followService.getFollowers(user.id),
                followService.getFollowing(user.id),
                searchService.getUserById(user.id),
            ])
            setFollowers(Array.isArray(fRes.followers) ? fRes.followers : [])
            setFollowing(Array.isArray(gRes.following) ? gRes.following : [])
            if (uRes.success) setProfileUser(uRes.user)
        } catch {
            // error handling not critical for UI here; state already optimistically toggled
        }
    }

    const handleFollowInList = async (targetId, listType) => {
        try {
            await toggleFollow(targetId)
            const updateList = (list) => list.map(item => 
                item.id === targetId ? { ...item, isFollowing: !item.isFollowing } : item
            );
            if (listType === 'followers') setFollowers(updateList(followers));
            else setFollowing(updateList(following));
            
            // If the user we just toggled is the profile we're looking at, re-fetch profile data
            if (targetId === user.id) {
                const [fRes, gRes, uRes] = await Promise.all([
                    followService.getFollowers(user.id),
                    followService.getFollowing(user.id),
                    searchService.getUserById(user.id),
                ])
                setFollowers(Array.isArray(fRes.followers) ? fRes.followers : [])
                setFollowing(Array.isArray(gRes.following) ? gRes.following : [])
                if (uRes.success) setProfileUser(uRes.user)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleNftClick = async (nft) => {
        if (nft.isListedForSale || (!nft.collectibleId && (nft.status === 'approved' || nft.status === 'listed'))) {
            const priceToPay = nft.isListedForSale ? nft.resalePrice : (nft.nftPriceINR || nft.price);
            const confirmBuy = window.confirm(`Buy this NFT for ₹${priceToPay}?`);
            if (confirmBuy) {
                try {
                    if (nft.collectibleId) {
                        await postService.buyResaleNft(nft.collectibleId);
                    } else {
                        await walletService.buyPostNFT(nft.id);
                    }
                    alert("NFT bought successfully!");
                    // Optimistic update
                    setNfts(prev => prev.map(n => (n.collectibleId === nft.collectibleId || n.id === nft.id) ? { ...n, status: 'sold', isListedForSale: false } : n));
                } catch (err) {
                    alert(err.message || 'Unable to buy NFT.');
                }
            }
        } else {
            if (!nft.collectibleId) return;
            const offerPrice = window.prompt("Enter your offer price in INR:");
            if (offerPrice && !isNaN(offerPrice)) {
                try {
                    await postService.placeOffer(nft.collectibleId, Number(offerPrice));
                    alert("Offer placed successfully!");
                } catch (err) {
                    alert(err.message || 'Unable to place offer.');
                }
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-inherit">
            {/* Header / Actions */}
            <div className="flex items-center justify-between px-4 pt-4 pb-4 sticky top-0 z-20"
                style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full cursor-pointer hover:bg-zinc-800/50">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1 px-4 truncate text-center">
                    <p className="text-base font-bold truncate">{user.username}</p>
                </div>
                <div className="flex items-center gap-1">
                    <div className="relative">
                        <button 
                            onClick={() => setShowShareMenu(!showShareMenu)}
                            className="p-2 rounded-full cursor-pointer hover:bg-zinc-800/50"
                        >
                            <Share2 size={20} />
                        </button>
                        <AnimatePresence>
                            {showShareMenu && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setShowShareMenu(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                        className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-40"
                                        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                                    >
                                        <button 
                                            onClick={() => {
                                                setShowShareMenu(false)
                                                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${user.username}'s profile on CryptoApp! ${window.location.href}`)}`, '_blank')
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-[var(--color-surface2)] transition-colors"
                                            style={{ color: 'var(--color-text)' }}
                                        >
                                            <MessageCircle size={18} className="text-green-500" />
                                            WhatsApp
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setShowShareMenu(false)
                                                navigate('/messaging', { state: { sharePost: { ...user, type: 'profile' } } })
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-[var(--color-surface2)] transition-colors"
                                            style={{ color: 'var(--color-text)' }}
                                        >
                                            <Share2 size={18} />
                                            Our Chat
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="flex-1">
                {/* Profile Info */}
                <div className="px-4 pt-6 pb-4">
                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <div
                                onClick={() => {
                                    if (user.hasStory) {
                                        navigate(`/home?openStory=${user.id}`);
                                    }
                                }}
                                className={`rounded-full ${user.hasStory ? 'p-[3px] bg-gradient-to-tr from-yellow-400 via-orange-500 to-purple-600 cursor-pointer shadow-xl scale-105 transition-transform active:scale-95' : ''}`}
                            >
                                <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-surface bg-surface2">
                                    <Avatar 
                                        src={!user.avatar || user.avatar === 'null' || user.avatar === 'undefined' ? null : user.avatar} 
                                        alt={user.username} 
                                        className="w-full h-full"
                                        size="w-full h-full" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex-1 grid grid-cols-4 gap-1 pt-4">
                            {[
                                { label: 'Posts', value: String(userPosts.length), onClick: null },
                                { label: 'NFTs', value: String(nfts.length), onClick: null },
                                { label: 'Followers', value: String(user.followersCount !== undefined ? user.followersCount : followers.length), onClick: () => setConnectionsOpen('followers') },
                                { label: 'Following', value: String(user.followingCount !== undefined ? user.followingCount : following.length), onClick: () => setConnectionsOpen('following') },
                            ].map((stat) => (
                                <div key={stat.label} className="flex flex-col items-center">
                                    <button
                                        type="button"
                                        onClick={stat.onClick || undefined}
                                        className={stat.onClick ? 'cursor-pointer' : 'cursor-default'}
                                    >
                                        <span className="text-base font-extrabold block text-center" style={{ color: 'var(--color-text)' }}>
                                            {stat.value}
                                        </span>
                                        <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                                            {stat.label}
                                        </span>
                                    </button>
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
                            {user.isPremium && (
                                <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center p-0.5">
                                    <Check size={12} className="text-white" strokeWidth={4} />
                                </div>
                            )}
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
                        {user.bio ? (
                            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-sub)' }}>
                                {user.bio}
                            </p>
                        ) : (
                            <p className="text-[11px] mt-1.5 italic opacity-50" style={{ color: 'var(--color-muted)' }}>
                                No bio available
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    {profile?.id !== userId && (
                        <div className="flex gap-2 mt-5">
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={handleToggleFollow}
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
                                onClick={() => navigate('/messaging', { state: { openChat: { id: user.id, username: user.username, handle: user.handle, avatar: user.avatar } } })}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                                style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                            >
                                Message
                            </motion.button>
                        </div>
                    )}

                    <SuggestedUsersSection />
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
                            {userPosts.map((post, idx) => (
                                <div key={post.id} className="relative aspect-square cursor-pointer overflow-hidden" onClick={() => setActivePostIndex(idx)}>
                                    {post.media?.type === 'video' ? (
                                        <>
                                            <video
                                                src={post.media?.url || post.thumbnail}
                                                muted
                                                playsInline
                                                loop
                                                preload="none"
                                                poster={post.media?.thumbnail || post.thumbnail}
                                                crossOrigin="anonymous"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                                                    <Play size={22} className="text-white" fill="white" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <img
                                            src={post.media?.url || post.thumbnail}
                                            alt="post"
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    )}
                                    {/* Views hidden for other users */}
                                    <div className="absolute bottom-1 right-1">
                                        <span
                                            className="text-[9px] font-bold px-1 py-0.5 rounded-sm"
                                            style={{ background: 'rgba(245,158,11,0.9)', color: '#fff' }}
                                        >
                                            ₹{post.earnings ?? 0}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'NFTs' && (
                        <div className="px-4 py-4 flex flex-col gap-3">
                            {nfts.map((nft) => (
                                <div
                                    key={nft.id}
                                    onClick={() => setActivePostIndex(nfts.findIndex((item) => String(item.id) === String(nft.id)))}
                                    className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                >
                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--color-surface2)' }}>
                                        {nft.media?.type === 'video' || nft.mediaType === 'video' ? (
                                            <video
                                                src={nft.media?.url || nft.mediaUrl}
                                                poster={nft.thumbnail || nft.media?.thumbnail || undefined}
                                                muted
                                                autoPlay
                                                loop
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />
                                        ) : nft.media?.type === 'audio' || nft.mediaType === 'audio' ? (
                                            <div className="w-full h-full flex items-center justify-center text-[var(--color-primary)]">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                                            </div>
                                        ) : (
                                            <img
                                                src={nft.thumbnail || nft.media?.thumbnail || nft.media?.url || nft.mediaUrl}
                                                alt={nft.caption || 'NFT'}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                            {nft.caption || 'Untitled NFT'}
                                        </p>
                                        <NFTBadge status={nft.status === 'approved' ? 'listed' : 'sold'} price={nft.nftPriceINR || 0} className="mt-1" />
                                    </div>
                                    <div className="shrink-0 flex items-center gap-2">
                                        <button 
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95"
                                            style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--color-primary)' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNftClick(nft);
                                            }}
                                        >
                                            {nft.isListedForSale || (!nft.collectibleId && (nft.status === 'approved' || nft.status === 'listed')) ? 'Buy NFT' : 'Make Offer'}
                                        </button>
                                        
                                        {profile?.id === userId && (
                                            <button 
                                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95"
                                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteModalConfig({
                                                        title: 'Delete NFT',
                                                        message: 'Are you sure you want to delete this NFT?',
                                                        onConfirm: async () => {
                                                            try {
                                                                await postService.deletePost(nft.id || nft.collectibleId);
                                                                setNfts(prev => prev.filter(n => String(n.id) !== String(nft.id) && String(n.collectibleId) !== String(nft.collectibleId)));
                                                                setDeleteModalConfig(null);
                                                            } catch (err) {
                                                                setDeleteModalConfig({
                                                                    title: 'Error',
                                                                    message: 'Failed to delete NFT.',
                                                                    onConfirm: () => setDeleteModalConfig(null),
                                                                    onCancel: () => setDeleteModalConfig(null)
                                                                });
                                                            }
                                                        },
                                                        onCancel: () => setDeleteModalConfig(null)
                                                    });
                                                }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {nfts.length === 0 && (
                                <p className="text-sm text-center py-6" style={{ color: 'var(--color-muted)' }}>No NFTs found for this user.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {activePostIndex !== null && (
                <PostFeedModal 
                    posts={activeTab === 'NFTs' ? nfts : userPosts} 
                    startIndex={activePostIndex} 
                    onClose={() => setActivePostIndex(null)} 
                />
            )}

            <AnimatePresence>
                {connectionsOpen && (
                    <motion.div
                        className="fixed inset-0 z-[120] flex flex-col justify-end"
                        style={{ background: 'rgba(0,0,0,0.6)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setConnectionsOpen(null)}
                    >
                        <motion.div
                            className="rounded-t-3xl px-5 pt-4 pb-8 max-h-[72vh] overflow-y-auto pb-[var(--bottom-nav-height)]"
                            style={{ background: 'var(--color-surface)' }}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-center mb-4">
                                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                                    {connectionsOpen === 'followers' ? 'Followers' : 'Following'}
                                </p>
                                <button onClick={() => setConnectionsOpen(null)} className="cursor-pointer">
                                    <X size={18} style={{ color: 'var(--color-muted)' }} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(connectionsOpen === 'followers' ? followers : following).map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
                                        style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
                                        onClick={() => {
                                            setConnectionsOpen(null);
                                            // Handle current user specifically to go to /profile vs /user/:id
                                            if (String(item.id) === String(profile?.id)) {
                                                navigate('/profile');
                                            } else {
                                                navigate(`/user/${item.id}`);
                                            }
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'var(--color-primary)' }}>
                                            {item.avatar ? (
                                                <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                item.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                                {item.name}
                                            </p>
                                            <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>
                                                {item.email || item.handle}
                                            </p>
                                        </div>
                                        {/* Follow Button */}
                                        {profile?.id && String(profile.id) !== String(item.id) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFollowInList(item.id, connectionsOpen);
                                                }}
                                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 shrink-0"
                                                style={item.isFollowing 
                                                    ? { background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }
                                                    : { background: 'var(--color-primary)', color: '#fff' }
                                                }
                                            >
                                                {item.isFollowing ? 'Following' : 'Follow'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deleteModalConfig && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={deleteModalConfig.onCancel}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden"
                            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                        >
                            <div className="p-5">
                                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>{deleteModalConfig.title}</h2>
                                {deleteModalConfig.message && (
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{deleteModalConfig.message}</p>
                                )}
                            </div>
                            <div className="flex gap-2 p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                <button
                                    onClick={deleteModalConfig.onCancel}
                                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                                    style={{ color: 'var(--color-text)', background: 'var(--color-surface2)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={deleteModalConfig.onConfirm}
                                    className="flex-1 py-3 rounded-xl text-sm font-bold shadow-md transition-transform active:scale-95"
                                    style={{ background: deleteModalConfig.title === 'Error' ? 'var(--color-primary)' : '#ef4444', color: deleteModalConfig.title === 'Error' ? '#000' : '#fff' }}
                                >
                                    {deleteModalConfig.title === 'Error' ? 'OK' : 'Confirm'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

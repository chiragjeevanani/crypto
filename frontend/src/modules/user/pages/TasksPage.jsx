import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import TaskCard from '../components/tasks/TaskCard'
import CampaignSkeleton from '../components/feed/CampaignSkeleton'
import ReelSkeleton from '../components/feed/ReelSkeleton'
import TaskDetailPage from './TaskDetailPage'
import PostFeedModal from '../components/feed/PostFeedModal'
import { useWalletStore } from '../store/useWalletStore'
import { useUserStore, getStoredToken } from '../store/useUserStore'
import { usePlatformSettings } from '../hooks/usePlatformSettings'
import { getUserNFTListings } from '../../../shared/nftListings'
import { userCampaignService } from '../services/campaignService'
import { postService } from '../services/postService'
import { mapCampaignToTask } from '../utils/campaignMapper'
import { getJoinedCampaignIds, markCampaignJoined } from '../utils/campaignStorage'
import axios from 'axios'
import { walletService } from '../services/walletService'

const FILTERS = ['All', 'Active', 'Joined']
const NFT_TABS = ['Discover', 'My Listings', 'My Collection', 'My Offers', 'Resale']


const mapPostToNFT = (post) => {
    const mediaType = post.mediaType || post.media?.type || 'image'
    const mediaUrl = post.mediaUrl || post.media?.url || ''
    return {
        id: post.id || post._id,
        collectibleId: post.collectibleId,
        title: post.caption || post.title || 'Untitled NFT',
        thumbnail: post.thumbnail || (mediaType === 'image' ? mediaUrl : (post.media?.thumbnail || '')),
        price: post.resalePrice || post.nftPriceINR || post.salePrice || post.basePrice || 1000,
        currency: 'INR',
        status: post.isListedForSale ? 'listed' : (post.status === 'approved' ? 'listed' : post.status),
        postStatus: post.status,
        buyer: post.owner?._id || post.winner?._id || null,
        listedAt: post.createdAt || post.acquiredAt,
        soldAt: null,
        views: post.views || 0,
        bids: post.comments || 0,
        creatorId: post.owner?._id || post.owner?.id || post.creator?.id || post.creator?._id || '',
        creatorName: post.owner?.name || post.owner?.username || post.creator?.name || post.creator?.username || 'Creator',
        creatorHandle: post.owner?.handle || post.creator?.handle || '@creator',
        creatorAvatar: post.owner?.avatar || post.creator?.avatar || null,
        mediaType,
        mediaUrl,
        source: 'backend',
        isListedForSale: post.isListedForSale,
        owner: post.owner,
        isOffer: post.isOffer,
        offerId: post.offerId,
        originalPrice: post.originalPrice
    }
}

export default function TasksPage() {
    const navigate = useNavigate()
    const { taskId: routeTaskId } = useParams()
    const [searchParams] = useSearchParams()
    const view = searchParams.get('view')
    const isNFTView = view === 'nft'

    const [activeFilter, setActiveFilter] = useState('All')
    const [selectedTask, setSelectedTask] = useState(null)
    const [campaignTasks, setCampaignTasks] = useState([])
    const [campaignLoading, setCampaignLoading] = useState(true)
    const [campaignError, setCampaignError] = useState('')

    const [nftTab, setNftTab] = useState('Discover')
    const [displayCurrency, setDisplayCurrency] = useState('INR')
    const [exchangeRates, setExchangeRates] = useState(null)
    const [ratesLoading, setRatesLoading] = useState(false)
    const [nftItems, setNftItems] = useState([])
    const [myNftItems, setMyNftItems] = useState([])
    const [myCollection, setMyCollection] = useState([])
    const [resaleItems, setResaleItems] = useState([])
    const [myOffers, setMyOffers] = useState([])
    const [nftLoading, setNftLoading] = useState(true)
    const [nftMessage, setNftMessage] = useState('')
    const [activeNftPostIndex, setActiveNftPostIndex] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    const { buyNft, addNftEarning } = useWalletStore()
    const { profile } = useUserStore()
    const platformSettings = usePlatformSettings()

    const [modalConfig, setModalConfig] = useState(null)

    useEffect(() => {
        const fetchRates = async () => {
            setRatesLoading(true)
            try {
                const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
                const res = await fetch(`${API_BASE}/config/exchange-rates`)
                const data = await res.json()
                if (data.success) setExchangeRates(data.rates)
            } catch (err) {
                console.error('Failed to fetch exchange rates')
            } finally {
                setRatesLoading(false)
            }
        }
        fetchRates()
        
        if (profile?.currencyCode) {
            setDisplayCurrency(profile.currencyCode)
        }

        const hydrate = async () => {
            const localItems = getUserNFTListings()
            setNftLoading(true)
            try {
                // Fetch all approved NFTs for Discover tab
                const res = await postService.getPosts({ isNFT: true })
                if (res.success && res.posts) {
                    const backendNFTs = res.posts.map((post) => mapPostToNFT(post))
                    const merged = [...backendNFTs, ...localItems.filter(l => !backendNFTs.find(b => b.id === l.id))]
                    setNftItems(merged)
                } else {
                    setNftItems(localItems)
                }

                // Fetch current user's own NFTs (all statuses) for My Listings tab
                const myRes = await postService.getMyNFTs()
                if (myRes.success && myRes.posts) {
                    const myBackendNFTs = myRes.posts.map((post) => mapPostToNFT(post))
                    const myLocal = localItems.filter(l => l.creatorId === 'me')
                    const myMerged = [...myBackendNFTs, ...myLocal.filter(l => !myBackendNFTs.find(b => b.id === l.id))]
                    setMyNftItems(myMerged)
                } else {
                    setMyNftItems(localItems.filter(l => l.creatorId === 'me'))
                }

                // Fetch current user's purchased NFTs for My Collection tab
                const collRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/nft/my/collection`, {
                    headers: { Authorization: `Bearer ${useUserStore.getState().token || ''}` }
                }).then(r => r.json()).catch(() => ({}));

                if (collRes.success && collRes.nfts) {
                    setMyCollection(collRes.nfts.map((nft) => mapPostToNFT({...nft, _id: nft.collectibleId, status: 'sold', owner: {_id: profile?._id || profile?.id}})))
                } else {
                    setMyCollection([])
                }

                // Fetch resale listings
                const resaleRes = await postService.getResaleListings()
                if (resaleRes.success && resaleRes.nfts) {
                    setResaleItems(resaleRes.nfts.map((nft) => mapPostToNFT({...nft, _id: nft.collectibleId, status: 'listed'})))
                } else {
                    setResaleItems([])
                }

                // Fetch my offers
                const offersRes = await postService.getMyOffers();
                if (offersRes.success && offersRes.offers) {
                    // Map offers to NFT display format
                    setMyOffers(offersRes.offers.map((offer) => {
                        const nftData = offer.nft || {};
                        return mapPostToNFT({
                            ...nftData,
                            _id: nftData.collectibleId || offer._id,
                            collectibleId: nftData.collectibleId,
                            title: nftData.title,
                            mediaUrl: nftData.mediaUrl,
                            status: 'offered',
                            resalePrice: offer.offerAmount, // use resalePrice so mapPostToNFT picks it up
                            originalPrice: nftData.resalePrice,
                            owner: offer.ownerId,
                            offerId: offer._id,
                            isOffer: true
                        });
                    }));
                } else {
                    setMyOffers([]);
                }
            } catch (err) {
                setNftItems(localItems)
                setMyNftItems(localItems.filter(l => l.creatorId === 'me'))
            } finally {
                setNftLoading(false)
            }
        }
        hydrate()
        const onUpdate = () => hydrate()
        const onStorage = (event) => {
            if (event.key === 'KnQ Reels_user_nft_listings_v1') hydrate()
        }
        window.addEventListener('nft-listings-updated', onUpdate)
        window.addEventListener('storage', onStorage)
        window.addEventListener('nft-offer-received', onUpdate)
        return () => {
            window.removeEventListener('nft-listings-updated', onUpdate)
            window.removeEventListener('storage', onStorage)
            window.removeEventListener('nft-offer-received', onUpdate)
        }
    }, [])

    useEffect(() => {
        if (profile?.currencyCode && profile.currencyCode !== 'INR' && displayCurrency === 'INR') {
            setDisplayCurrency(profile.currencyCode)
        }
    }, [profile?.currencyCode])


    useEffect(() => {
        let mounted = true
        const load = async () => {
            setCampaignLoading(true)
            setCampaignError('')
            try {
                const joinedIds = new Set(getJoinedCampaignIds())
                const list = await userCampaignService.listActive()
                const mapped = (list || []).map((campaign) => mapCampaignToTask(campaign, joinedIds.has(String(campaign.id))))
                if (mounted) setCampaignTasks(mapped.filter(Boolean))
            } catch (error) {
                if (mounted) setCampaignError(error?.message || 'Failed to load campaigns')
            } finally {
                if (mounted) setCampaignLoading(false)
            }
        }
        load()
        const onJoined = () => load()
        const onStorage = (event) => {
            if (event.key === 'crypto_joined_campaigns_v1') load()
        }
        window.addEventListener('user-campaigns-joined', onJoined)
        window.addEventListener('storage', onStorage)
        return () => {
            mounted = false
            window.removeEventListener('user-campaigns-joined', onJoined)
            window.removeEventListener('storage', onStorage)
        }
    }, [])

    const allTasks = useMemo(() => [...campaignTasks], [campaignTasks])
    const filtered = allTasks.filter((t) => {
        if (activeFilter === 'Joined') return t.joined
        if (activeFilter === 'Active') return t.status === 'active'
        return true
    })

    const filteredNFTs = useMemo(() => {
        let items = []
        if (nftTab === 'My Listings') items = myNftItems
        else if (nftTab === 'My Collection') items = myCollection
        else if (nftTab === 'Resale') items = resaleItems
        else if (nftTab === 'My Offers') items = myOffers
        else items = nftItems

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            return items.filter(nft => 
                nft.title?.toLowerCase().includes(q) || 
                nft.creatorName?.toLowerCase().includes(q) ||
                nft.creatorHandle?.toLowerCase().includes(q)
            )
        }
        return items
    }, [nftItems, myNftItems, myCollection, resaleItems, myOffers, nftTab, searchQuery])

    const nftFeedPosts = useMemo(() => (
        filteredNFTs.map((nft, idx) => ({
            id: nft.id,
            creator: {
                id: nft.creatorId || `nft-creator-${idx + 1}`,
                username: nft.creatorName || 'NFT Creator',
                handle: nft.creatorHandle || '@nftcreator',
                avatar: nft.creatorAvatar || null,
                isFollowing: false,
            },
            media: {
                type: nft.media?.type || 'image',
                url: nft.media?.url || nft.mediaUrl || nft.thumbnail,
                aspectRatio: '1/1',
            },
            caption: `${nft.title} · ${nft.status === 'listed' ? 'Listed for sale' : `Owned by ${nft.buyer || 'collector'}`}`,
            postType: 'nft',
            allowGifts: false,
            likes: nft.views || 0,
            comments: nft.bids || 0,
            shares: Math.max(1, Math.floor((nft.views || 0) / 8)),
            earnings: nft.price || 0,
            isLiked: false,
            createdAt: nft.listedAt || new Date().toISOString(),
            nftData: nft, // Add nftData for the modal
        }))
    ), [filteredNFTs])

    useEffect(() => {
        const action = searchParams.get('action');
        const id = searchParams.get('id');
        if (action === 'buy' && id && !modalConfig) {
            const allNfts = [...nftItems, ...resaleItems, ...myNftItems, ...myCollection];
            const nftToBuy = allNfts.find(n => String(n.id) === String(id) || String(n.collectibleId) === String(id));
            if (nftToBuy) {
                setTimeout(() => toggleBuyResell(nftToBuy), 100);
                navigate('/tasks?view=nft', { replace: true });
            }
        }
    }, [searchParams, nftItems, resaleItems, myNftItems, myCollection]);

    const toggleBuyResell = async (nft) => {
        if (nft.isOffer) {
            const confirmCancel = window.confirm(`Cancel your offer of ₹${nft.price} on "${nft.title}"? Coins will be refunded.`);
            if (confirmCancel) {
                try {
                    await postService.cancelOffer(nft.collectibleId, nft.offerId);
                    setNftMessage(`Offer on "${nft.title}" cancelled successfully.`);
                    
                    // Re-fetch offers
                    const offersRes = await postService.getMyOffers();
                    if (offersRes.success && offersRes.offers) {
                        setMyOffers(offersRes.offers.map((offer) => {
                            const nftData = offer.nft || {};
                            return mapPostToNFT({
                                ...nftData,
                                _id: nftData.collectibleId || offer._id,
                                collectibleId: nftData.collectibleId,
                                title: nftData.title,
                                mediaUrl: nftData.mediaUrl,
                                status: 'offered',
                                resalePrice: offer.offerAmount,
                                owner: offer.ownerId,
                                offerId: offer._id,
                                isOffer: true
                            });
                        }));
                    } else {
                        setMyOffers([]);
                    }
                } catch (err) {
                    setNftMessage(err.message || 'Unable to cancel offer.');
                }
            }
            return;
        }

        const currentUserId = profile?._id || profile?.id;
        const isCurrentOwner = 
            (nftTab === 'My Collection') || 
            (nftTab === 'My Listings') ||
            (nft.owner?._id && nft.owner?._id === currentUserId) || 
            (nft.owner?.id && nft.owner?.id === currentUserId) || 
            (nft.owner === currentUserId) ||
            (nft.buyer && nft.buyer === currentUserId) || 
            (nft.creatorId && nft.creatorId === currentUserId && nft.status !== 'sold');

        if (isCurrentOwner) {
            try {
                const collectibleId = nft.collectibleId || nft.id;
                const offersRes = collectibleId ? await postService.getOffersForCollectible(collectibleId).catch(() => ({ success: false })) : { success: false };
                const offers = offersRes.success ? offersRes.offers : [];
                
                setModalConfig({
                    type: 'manage_nft',
                    title: 'Manage NFT',
                    nft,
                    offers,
                    onRelist: async (newPrice) => {
                        setModalConfig(null);
                        if (!newPrice) return;
                        
                        try {
                            if (nft.collectibleId) {
                                await postService.relistNft(nft.collectibleId, Number(newPrice));
                            } else {
                                // Fallback if it's not a true collectible yet but just a post
                                setNftMessage(`Relisting functionality requires a minted collectible.`);
                                return;
                            }
                            setNftMessage(`NFT "${nft.title}" successfully relisted.`);
                            
                            // Re-fetch my collection
                            const collRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/nft/my/collection`, {
                                headers: { Authorization: `Bearer ${useUserStore.getState().token || ''}` }
                            }).then(r => r.json()).catch(() => ({}));
                            if (collRes.success && collRes.nfts) {
                                setMyCollection(collRes.nfts.map((n) => mapPostToNFT({...n, _id: n.collectibleId, status: 'sold', owner: {_id: profile?._id || profile?.id}})))
                            }

                            const resaleRes = await postService.getResaleListings()
                            if (resaleRes.success && resaleRes.nfts) {
                                setResaleItems(resaleRes.nfts.map((n) => mapPostToNFT({...n, _id: n.collectibleId, status: 'listed'})))
                            }
                        } catch (err) {
                            setNftMessage(err.message || 'Unable to relist NFT.');
                        }
                    },
                    onAcceptOffer: async (offerId) => {
                        setModalConfig(null);
                        try {
                            if (!nft.collectibleId) {
                                setNftMessage(`Cannot accept offer on unminted collectible.`);
                                return;
                            }
                            await postService.acceptOffer(nft.collectibleId, offerId);
                            setNftMessage(`Offer accepted successfully!`);
                            
                            // Re-fetch my collection
                            const collRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/nft/my/collection`, {
                                headers: { Authorization: `Bearer ${useUserStore.getState().token || ''}` }
                            }).then(r => r.json()).catch(() => ({}));
                            if (collRes.success && collRes.nfts) {
                                setMyCollection(collRes.nfts.map((n) => mapPostToNFT({...n, _id: n.collectibleId, status: 'sold', owner: {_id: profile?._id || profile?.id}})))
                            }
                        } catch (err) {
                            setNftMessage(err.message || 'Unable to accept offer.');
                        }
                    },
                    onCancel: () => setModalConfig(null)
                });
            } catch (err) {
                setNftMessage('Unable to load offers.');
            }
            return;
        }

        if (nft.status === 'listed') {
            const isLocal = displayCurrency === 'INR';
            const rateINR = exchangeRates?.['INR'] || 83;
            const rateTarget = displayCurrency === 'USD' ? 1 : (exchangeRates?.[displayCurrency] || 1);

            const converted = isLocal ? nft.price : (nft.price * 1.05 * (rateTarget / rateINR));
            const valueStr = converted.toFixed(isLocal ? 0 : 2);
            const symbol = isLocal ? '₹' : (displayCurrency === 'USD' ? '$' : (profile?.currencySymbol || displayCurrency));
            const displayPriceStr = `${symbol}${valueStr}`;

            setModalConfig({
                type: 'confirm',
                title: 'Confirm Purchase',
                message: `Confirm purchase of "${nft.title}" for ${displayPriceStr} from your wallet balance?`,
                onConfirm: async () => {
                    setModalConfig(null);
                    try {
                        if (nft.collectibleId) {
                            await postService.buyResaleNft(nft.collectibleId);
                        } else {
                            await walletService.buyPostNFT(nft.id);
                        }
                        setNftMessage(`NFT bought successfully for ${displayPriceStr}.`)
                        
                        // Immediately remove the bought NFT from the discover feed and resale items
                        setNftItems(prev => prev.filter(item => item.id !== nft.id));
                        setResaleItems(prev => prev.filter(item => item.id !== nft.id && item.collectibleId !== nft.collectibleId));
                        
                        // Refetch collection and resale listings
                        const collRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/nft/my/collection`, {
                            headers: { Authorization: `Bearer ${useUserStore.getState().token || ''}` }
                        }).then(r => r.json()).catch(() => ({}));
                        if (collRes.success && collRes.nfts) {
                            setMyCollection(collRes.nfts.map((n) => mapPostToNFT({...n, _id: n.collectibleId, status: 'sold', owner: {_id: profile?._id || profile?.id}})))
                        }

                        const resaleRes = await postService.getResaleListings()
                        if (resaleRes.success && resaleRes.nfts) {
                            setResaleItems(resaleRes.nfts.map((n) => mapPostToNFT({...n, _id: n.collectibleId, status: 'listed'})))
                        }
                    } catch (err) {
                        setNftMessage(err.message || 'Unable to buy NFT.');
                    }
                },
                onCancel: () => setModalConfig(null)
            })
        } else {
            // Someone else owns it, and it's not listed. We can make an offer.
                const isLocal = displayCurrency === 'INR';
                const rateINR = exchangeRates?.['INR'] || 83;
                const rateTarget = displayCurrency === 'USD' ? 1 : (exchangeRates?.[displayCurrency] || 1);
                const localDefault = isLocal ? nft.price : (nft.price * 1.05 * (rateTarget / rateINR));

                setModalConfig({
                    type: 'prompt',
                    title: 'Make an Offer',
                    message: `Enter your offer price in ${displayCurrency} (coins will be held in escrow):`,
                    defaultValue: localDefault.toFixed(isLocal ? 0 : 2),
                    onConfirm: async (offerPrice) => {
                        setModalConfig(null);
                        if (!offerPrice) return;
                        
                        const basePrice = isLocal ? Number(offerPrice) : (Number(offerPrice) / (1.05 * (rateTarget / rateINR)));

                        try {
                            await postService.placeOffer(nft.collectibleId, basePrice);
                            setNftMessage(`Offer placed for "${nft.title}".`);
                        } catch (err) {
                            setNftMessage(err.message || 'Unable to place offer.');
                        }
                    },
                    onCancel: () => setModalConfig(null)
                })
            }
        };

    useEffect(() => {
        if (isNFTView || !routeTaskId) return
        const match = allTasks.find((task) => task.id === routeTaskId)
        if (match) setSelectedTask(match)
    }, [isNFTView, routeTaskId, allTasks])

    const openTaskDetailPage = (task) => {
        navigate(`/tasks/${encodeURIComponent(task.id)}`)
    }

    const handleJoin = async (task) => {
        if (!task?.campaignId || task.joined) return
        try {
            await userCampaignService.join(task.campaignId)
            markCampaignJoined(task.campaignId)
            setCampaignTasks((state) =>
                state.map((item) =>
                    item.id === task.id
                        ? { ...item, joined: true, participants: (item.participants || 0) + 1 }
                        : item
                )
            )
        } catch {
            // ignore for now; detail page will show error if needed
        }
    }

    if (!isNFTView && routeTaskId) {
        if (!selectedTask) {
            return (
                <div className="px-4 pt-6">
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Campaign not found.</p>
                    <button
                        onClick={() => navigate('/tasks')}
                        className="mt-3 text-sm font-semibold"
                        style={{ color: 'var(--color-primary)' }}
                    >
                        Back to campaigns
                    </button>
                </div>
            )
        }
        return <TaskDetailPage task={selectedTask} />
    }

    return (
        <div className={isNFTView ? "pb-24 min-h-screen bg-[var(--color-background)]" : "px-4 pt-4 pb-24"}>
            {!isNFTView && (
                <div className="mb-4">
                    <h1 className="text-xl font-extrabold" style={{ color: 'var(--color-text)' }}>Earn</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        Complete tasks, join voting, get paid
                    </p>
                </div>
            )}

            {!isNFTView ? (
                <>
                    <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
                        {FILTERS.map((f) => {
                            const active = f === activeFilter
                            return (
                                <motion.button
                                    key={f}
                                    whileTap={{ scale: 0.93 }}
                                    onClick={() => setActiveFilter(f)}
                                    className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-all duration-150"
                                    style={{
                                        background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                                        color: active ? '#fff' : 'var(--color-muted)',
                                        border: active ? 'none' : '1px solid var(--color-border)',
                                    }}
                                >
                                    {f}
                                </motion.button>
                            )
                        })}
                    </div>

                    <div>
                        {campaignLoading && (
                            <div className="space-y-4">
                                {[1, 2, 3].map((n) => (
                                    <CampaignSkeleton key={n} />
                                ))}
                            </div>
                        )}
                        {campaignError && !campaignLoading && (
                            <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>{campaignError}</p>
                        )}
                        {!campaignLoading && !campaignError && filtered.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onClick={() => openTaskDetailPage(task)}
                                onJoin={handleJoin}
                                showJoin
                            />
                        ))}
                        {!campaignLoading && !campaignError && filtered.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No tasks found</p>
                            </div>
                        )}
                    </div>

                </>
            ) : (
                <div className="w-full">
                    {/* ── Flipkart Style Header ── */}
                    <div 
                        className="w-full px-4 pt-5 pb-3 sticky top-0 z-20 shadow-md"
                        style={{ background: 'linear-gradient(180deg, #047BD5 0%, #0060A8 100%)' }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-extrabold italic text-white drop-shadow-md">e Digital Marketplace</h1>
                                <div className="px-1.5 py-0.5 bg-yellow-400 rounded text-[9px] font-bold text-black uppercase tracking-wider">Plus</div>
                            </div>
                            <button onClick={() => navigate('/create')} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                                +
                            </button>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-gray-500">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for Collectibles, Users..." 
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] font-medium outline-none bg-white text-black shadow-inner"
                            />
                        </div>
                    </div>

                    {/* ── Category Navigation Row ── */}
                    <div className="bg-[var(--color-surface)] shadow-sm overflow-x-auto hide-scrollbar border-b border-[var(--color-border)]">
                        <div className="flex px-3 py-4 gap-6 min-w-max">
                            {[
                                { name: 'Discover', icon: '🏠', id: 'Discover' },
                                { name: 'My Listings', icon: '📝', id: 'My Listings' },
                                { name: 'Collection', icon: '🎒', id: 'My Collection' },
                                { name: 'Offers', icon: '🤝', id: 'My Offers' },
                                { name: 'Resale', icon: '🔄', id: 'Resale' }
                            ].map((tab) => {
                                const active = nftTab === tab.id;
                                return (
                                    <motion.button
                                        key={tab.id}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setNftTab(tab.id)}
                                        className="flex flex-col items-center gap-1.5 cursor-pointer relative"
                                    >
                                        <div 
                                            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${active ? 'bg-blue-50 border-2 border-[#047BD5]' : 'bg-[var(--color-background)] border border-[var(--color-border)]'}`}
                                            style={{ boxShadow: active ? '0 4px 10px rgba(4,123,213,0.15)' : 'none' }}
                                        >
                                            {tab.icon}
                                        </div>
                                        <span 
                                            className="text-[11px] whitespace-nowrap"
                                            style={{ 
                                                fontWeight: active ? '800' : '600',
                                                color: active ? '#047BD5' : 'var(--color-muted)'
                                            }}
                                        >
                                            {tab.name}
                                        </span>
                                        {active && (
                                            <motion.div layoutId="category-indicator" className="absolute -bottom-4 w-1/2 h-1 bg-[#047BD5] rounded-t-full" />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Toast Message ── */}
                    <div className="px-4 mt-3">
                        <AnimatePresence>
                            {nftMessage && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-green-50 text-green-700 border border-green-200 shadow-sm flex items-center justify-between">
                                        <span>{nftMessage}</span>
                                        <button onClick={() => setNftMessage('')} className="opacity-50 hover:opacity-100 text-lg">&times;</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── Banners Section (Only on Discover) ── */}
                    {nftTab === 'Discover' && !nftLoading && filteredNFTs.length > 2 && (
                        <div className="mt-2 mb-4 bg-yellow-400 py-4 shadow-sm relative overflow-hidden">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply opacity-50 blur-xl translate-x-10 -translate-y-10" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-500 rounded-full mix-blend-multiply opacity-20 blur-lg -translate-x-5 translate-y-5" />
                            
                            <div className="px-4 flex items-center justify-between mb-3 relative z-10">
                                <h2 className="text-lg font-black text-black uppercase tracking-tight flex items-center gap-1.5">
                                    <span>🔥</span> Trending Deals
                                </h2>
                                <span className="text-[10px] font-bold bg-black text-white px-2 py-1 rounded-full">LIVE</span>
                            </div>
                            
                            <div className="flex overflow-x-auto hide-scrollbar gap-3 px-4 pb-2 relative z-10">
                                {filteredNFTs.slice(0, 4).map((nft, i) => {
                                    const isLocal = displayCurrency === 'INR';
                                    const rateINR = exchangeRates?.['INR'] || 83;
                                    const rateTarget = displayCurrency === 'USD' ? 1 : (exchangeRates?.[displayCurrency] || 1);
                                    const converted = isLocal ? nft.price : (nft.price * 1.05 * (rateTarget / rateINR));
                                    const symbol = isLocal ? '₹' : (displayCurrency === 'USD' ? '$' : (profile?.currencySymbol || displayCurrency));
                                    const displayPriceStr = `${symbol}${converted.toFixed(isLocal ? 0 : 2)}`;
                                    
                                    return (
                                        <motion.div 
                                            key={`deal-${nft.id}`}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                const idx = filteredNFTs.findIndex((item) => item.id === nft.id);
                                                if (idx >= 0) setActiveNftPostIndex(idx);
                                            }}
                                            className="min-w-[140px] w-[140px] bg-white rounded-xl overflow-hidden shadow-md border border-yellow-200 flex-shrink-0 cursor-pointer"
                                        >
                                            <div className="w-full aspect-square bg-gray-100 relative">
                                                {nft.mediaType === 'video' && nft.mediaUrl ? (
                                                    <video src={nft.mediaUrl} className="w-full h-full object-cover" muted playsInline autoPlay loop />
                                                ) : (
                                                    <img src={nft.thumbnail || nft.mediaUrl || '/person.png'} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="p-2 text-center">
                                                <p className="text-[11px] text-gray-500 font-medium truncate mb-0.5">{nft.title}</p>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className="text-[13px] font-black text-black">{displayPriceStr}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="px-4 mb-2 mt-4 flex items-center justify-between">
                        <h2 className="text-sm font-extrabold" style={{ color: 'var(--color-text)' }}>
                            {nftTab === 'Discover' ? 'All Collectibles' : nftTab}
                        </h2>
                        {nftTab === 'Discover' && <span className="text-[11px] font-bold text-[#047BD5]">View All</span>}
                    </div>

                    {/* ── NFT Grid ── */}
                    <div className="grid grid-cols-2 gap-3 pb-24 px-4">
                        {nftLoading ? (
                            [1, 2, 3, 4].map((n) => (
                                <div
                                    key={n}
                                    className="overflow-hidden rounded-2xl animate-pulse"
                                    style={{
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                    }}
                                >
                                    <div className="w-full aspect-square" style={{ background: 'var(--color-border)' }} />
                                    <div className="p-3 space-y-2">
                                        <div className="h-3 rounded-full" style={{ background: 'var(--color-border)', width: '70%' }} />
                                        <div className="h-3 rounded-full" style={{ background: 'var(--color-border)', width: '45%' }} />
                                        <div className="h-7 rounded-full mt-2" style={{ background: 'var(--color-border)' }} />
                                    </div>
                                </div>
                            ))
                        ) : filteredNFTs.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-2 py-16 text-center flex flex-col items-center gap-3"
                            >
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                                    style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px dashed rgba(245,158,11,0.3)' }}
                                >
                                    💎
                                </div>
                                <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                                    {nftTab === 'My Listings'
                                        ? "You haven't minted any NFTs yet"
                                        : nftTab === 'My Collection'
                                        ? 'Your collection is empty'
                                        : nftTab === 'Resale'
                                        ? 'No resale NFTs available yet'
                                        : nftTab === 'My Offers'
                                        ? "You haven't made any offers yet"
                                        : 'No collectibles in the marketplace yet'}
                                </p>
                                {nftTab === 'Discover' && (
                                    <button
                                        onClick={() => navigate('/create')}
                                        className="px-5 py-2 rounded-full text-xs font-bold cursor-pointer transition-all"
                                        style={{
                                            background: 'var(--color-primary)',
                                            color: '#000',
                                        }}
                                    >
                                        + Submit Your NFT
                                    </button>
                                )}
                            </motion.div>
                        ) : null}

                        {!nftLoading && filteredNFTs.map((nft, idx) => {
                            const isLocal = displayCurrency === 'INR';
                            const rateINR = exchangeRates?.['INR'] || 83;
                            const rateTarget = displayCurrency === 'USD' ? 1 : (exchangeRates?.[displayCurrency] || 1);
                            const converted = isLocal ? nft.price : (nft.price * 1.05 * (rateTarget / rateINR));
                            const valueStr = converted.toFixed(isLocal ? 0 : 2);
                            const symbol = isLocal ? '₹' : (displayCurrency === 'USD' ? '$' : (profile?.currencySymbol || displayCurrency));
                            const displayPriceStr = `${symbol}${valueStr}`;

                            const currentUserId = profile?._id || profile?.id;
                            const isOwnerOrCreator = 
                                (nft.owner?._id && nft.owner?._id === currentUserId) || 
                                (nft.owner?.id && nft.owner?.id === currentUserId) || 
                                (nft.owner === currentUserId) ||
                                (nft.buyer && nft.buyer === currentUserId) || 
                                (nft.creatorId && nft.creatorId === currentUserId) ||
                                (nftTab === 'My Collection') || (nftTab === 'My Listings');

                            const btnLabel = nft.isOffer
                                ? 'Cancel Offer'
                                : isOwnerOrCreator
                                ? 'Relist / View Offers'
                                : nft.status === 'listed'
                                ? 'Buy (Global)'
                                : 'Make Offer';

                            return (
                                <motion.div
                                    key={nft.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: idx * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                                    whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1), 0 4px 8px rgba(245,158,11,0.05)' }}
                                    whileTap={{ scale: 0.97 }}
                                    className="overflow-hidden cursor-pointer group"
                                    style={{
                                        borderRadius: '20px',
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                                    }}
                                    onClick={() => {
                                        const i = filteredNFTs.findIndex((item) => item.id === nft.id);
                                        if (i >= 0) setActiveNftPostIndex(i);
                                    }}
                                >
                                    {/* ── Card Image ── */}
                                    <div className="w-full aspect-square overflow-hidden relative" style={{ background: 'var(--color-surface2)' }}>
                                        {nft.media?.type === 'video' || nft.mediaType === 'video' ? (
                                            <video
                                                src={nft.media?.url || nft.mediaUrl}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                                muted
                                                playsInline
                                                autoPlay
                                                loop
                                                poster={nft.thumbnail || undefined}
                                            />
                                        ) : (
                                            <img
                                                src={nft.thumbnail || nft.mediaUrl || '/person.png'}
                                                alt={nft.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                                onError={(e) => { e.target.onerror = null; e.target.src = '/person.png'; }}
                                            />
                                        )}
                                        {/* Subtle overlay on hover */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                                        {/* Status badge */}
                                        {nft.postStatus === 'pending' && (
                                            <div
                                                className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wide"
                                                style={{ background: 'rgba(245,158,11,0.92)', color: '#000' }}
                                            >
                                                PENDING
                                            </div>
                                        )}
                                        {nft.postStatus === 'rejected' && (
                                            <div
                                                className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wide"
                                                style={{ background: 'rgba(239,68,68,0.92)', color: '#fff' }}
                                            >
                                                REJECTED
                                            </div>
                                        )}
                                        {nft.isListedForSale && (
                                            <div
                                                className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wide shadow-sm backdrop-blur-sm"
                                                style={{ background: 'rgba(245, 158, 11, 0.95)', color: '#000' }}
                                            >
                                                RELISTED
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Card Body ── */}
                                    <div className="p-3.5 flex flex-col gap-1.5">
                                        <p
                                            className="text-[14px] font-bold truncate leading-tight group-hover:text-[var(--color-primary)] transition-colors duration-300"
                                            style={{ color: 'var(--color-text)' }}
                                        >
                                            {nft.title}
                                        </p>

                                        {/* Price */}
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[rgba(245,158,11,0.15)] text-[var(--color-primary)] text-[10px]">
                                                💎
                                            </div>
                                            <p
                                                className="text-[14px] font-extrabold"
                                                style={{ 
                                                    background: 'linear-gradient(135deg, var(--color-primary), #D97706)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                }}
                                            >
                                                {nft.isOffer ? `Offer: ${displayPriceStr}` : displayPriceStr}
                                            </p>
                                        </div>
                                        {nft.isOffer && nft.originalPrice > 0 && (
                                            <p className="text-[10px] ml-6 font-medium" style={{ color: 'var(--color-muted)' }}>
                                                Listed: {(() => {
                                                    const o = isLocal ? nft.originalPrice : (nft.originalPrice * 1.05 * (rateTarget / rateINR));
                                                    return `${symbol}${o.toFixed(isLocal ? 0 : 2)}`;
                                                })()}
                                            </p>
                                        )}

                                        {/* Buy Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.02, backgroundColor: 'var(--color-primary)', color: '#000' }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleBuyResell(nft);
                                            }}
                                            className="mt-2.5 w-full py-2.5 text-[12px] font-bold cursor-pointer transition-all duration-300"
                                            style={{
                                                borderRadius: '9999px',
                                                background: 'rgba(245,158,11,0.08)',
                                                color: 'var(--color-primary)',
                                                border: '1.5px solid rgba(245,158,11,0.5)',
                                            }}
                                        >
                                            {btnLabel}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                    <PostFeedModal
                        posts={nftFeedPosts}
                        startIndex={activeNftPostIndex}
                        onClose={() => setActiveNftPostIndex(null)}
                        forceReels={true}
                        onNftAction={(nft) => {
                            setActiveNftPostIndex(null); // Optional: close modal on action
                            toggleBuyResell(nft);
                        }}
                    />

                    {modalConfig && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-sm overflow-hidden rounded-2xl p-5 shadow-xl"
                                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                            >
                                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                                    {modalConfig.title}
                                </h3>
                                <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
                                    {modalConfig.message}
                                </p>
                                
                                {modalConfig.type === 'prompt' && (
                                    <input
                                        type="number"
                                        autoFocus
                                        defaultValue={modalConfig.defaultValue}
                                        id="prompt-input"
                                        className="w-full mb-4 px-3 py-2 rounded-lg text-sm outline-none"
                                        style={{ background: 'var(--color-background)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                    />
                                )}

                                {modalConfig.type === 'manage_nft' && (
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-2">
                                            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>
                                                Current Price:{' '}
                                                <span style={{ color: 'var(--color-text)' }}>
                                                    {(() => {
                                                        const isLocal = displayCurrency === 'INR';
                                                        const rateINR = exchangeRates?.['INR'] || 83;
                                                        const rateTarget = displayCurrency === 'USD' ? 1 : (exchangeRates?.[displayCurrency] || 1);
                                                        const converted = isLocal ? modalConfig.nft.price : (modalConfig.nft.price * 1.05 * (rateTarget / rateINR));
                                                        const symbol = isLocal ? '₹' : (displayCurrency === 'USD' ? '$' : (profile?.currencySymbol || displayCurrency));
                                                        return `${symbol}${converted.toFixed(isLocal ? 0 : 2)}`;
                                                    })()}
                                                </span>
                                            </p>
                                            <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Relist NFT</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    id="relist-input"
                                                    placeholder={`Price in ${displayCurrency}`}
                                                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                                    style={{ background: 'var(--color-background)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const rawVal = Number(document.getElementById('relist-input')?.value);
                                                        if (!rawVal) return;
                                                        const isLocal = displayCurrency === 'INR';
                                                        const rateINR = exchangeRates?.['INR'] || 83;
                                                        const rateTarget = displayCurrency === 'USD' ? 1 : (exchangeRates?.[displayCurrency] || 1);
                                                        const basePrice = isLocal ? rawVal : (rawVal / (1.05 * (rateTarget / rateINR)));
                                                        modalConfig.onRelist(basePrice);
                                                    }}
                                                    className="px-4 py-2 rounded-xl text-xs font-semibold shrink-0"
                                                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                                                >
                                                    Relist
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Offers ({modalConfig.offers?.length || 0})</p>
                                            {modalConfig.offers?.length === 0 ? (
                                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No offers yet.</p>
                                            ) : (
                                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                                    {modalConfig.offers.map((offer) => (
                                                        <div key={offer._id} className="flex justify-between items-center p-2 rounded border" style={{ borderColor: 'var(--color-border)' }}>
                                                            <div>
                                                                <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                                                                    {(() => {
                                                                        const isLocal = displayCurrency === 'INR';
                                                                        const rateINR = exchangeRates?.['INR'] || 83;
                                                                        const rateTarget = displayCurrency === 'USD' ? 1 : (exchangeRates?.[displayCurrency] || 1);
                                                                        const amount = offer.offerAmount || offer.offerPrice || 0;
                                                                        const converted = isLocal ? amount : (amount * 1.05 * (rateTarget / rateINR));
                                                                        const symbol = isLocal ? '₹' : (displayCurrency === 'USD' ? '$' : (profile?.currencySymbol || displayCurrency));
                                                                        return `${symbol}${converted.toFixed(isLocal ? 0 : 2)}`;
                                                                    })()}
                                                                </p>
                                                                <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>by {offer.buyer?.handle || '@user'}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => modalConfig.onAcceptOffer(offer._id)}
                                                                className="px-2 py-1 rounded text-[10px] font-bold"
                                                                style={{ background: 'var(--color-primary)', color: '#fff' }}
                                                            >
                                                                Accept
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        onClick={modalConfig.onCancel}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                        style={{ color: 'var(--color-text)', background: 'var(--color-background)', border: '1px solid var(--color-border)' }}
                                    >
                                        {modalConfig.type === 'manage_nft' ? 'Close' : 'Cancel'}
                                    </button>
                                    {modalConfig.type !== 'manage_nft' && (
                                        <button
                                            onClick={() => {
                                                if (modalConfig.type === 'prompt') {
                                                    const val = document.getElementById('prompt-input')?.value;
                                                    modalConfig.onConfirm(val);
                                                } else {
                                                    modalConfig.onConfirm();
                                                }
                                            }}
                                            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                            style={{ background: 'var(--color-primary)', color: '#fff' }}
                                        >
                                            Confirm
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}

                </div>
            )}
        </div>
    )
}

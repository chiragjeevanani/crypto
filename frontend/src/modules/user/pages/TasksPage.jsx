import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import TaskCard from '../components/tasks/TaskCard'
import CampaignSkeleton from '../components/feed/CampaignSkeleton'
import ReelSkeleton from '../components/feed/ReelSkeleton'
import TaskDetailPage from './TaskDetailPage'
import PostFeedModal from '../components/feed/PostFeedModal'
import { useWalletStore } from '../store/useWalletStore'
import { useUserStore } from '../store/useUserStore'
import { usePlatformSettings } from '../hooks/usePlatformSettings'
import { getUserNFTListings } from '../../../shared/nftListings'
import { userCampaignService } from '../services/campaignService'
import { postService } from '../services/postService'
import { mapCampaignToTask } from '../utils/campaignMapper'
import { getJoinedCampaignIds, markCampaignJoined } from '../utils/campaignStorage'

const FILTERS = ['All', 'Active', 'Joined']
const NFT_TABS = ['Discover', 'My Listings', 'My Collection', 'Resale']

const mapPostToNFT = (post) => {
    const mediaType = post.media?.type || 'image'
    const mediaUrl = post.media?.url || ''
    return {
        id: post.id || post._id,
        title: post.caption || 'Untitled NFT',
        thumbnail: mediaType === 'image' ? mediaUrl : (post.media?.thumbnail || ''),
        price: post.nftPriceINR || 1000,
        currency: 'INR',
        status: post.status === 'approved' ? 'listed' : post.status,
        postStatus: post.status,
        buyer: null,
        listedAt: post.createdAt,
        soldAt: null,
        views: post.views || 0,
        bids: post.comments || 0,
        creatorId: post.creator?.id || '',
        creatorName: post.creator?.name || post.creator?.username || 'Creator',
        creatorHandle: post.creator?.handle || '@creator',
        mediaType,
        mediaUrl,
        source: 'backend',
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
    const [nftLoading, setNftLoading] = useState(false)
    const [nftMessage, setNftMessage] = useState('')
    const [activeNftPostIndex, setActiveNftPostIndex] = useState(null)

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
                const collRes = await postService.getMyCollection()
                if (collRes.success && collRes.posts) {
                    setMyCollection(collRes.posts.map((post) => mapPostToNFT(post)))
                } else {
                    setMyCollection([])
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
        window.addEventListener('storage', onStorage)
        return () => {
            window.removeEventListener('nft-listings-updated', onUpdate)
            window.removeEventListener('storage', onStorage)
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
        if (nftTab === 'My Listings') return myNftItems
        if (nftTab === 'My Collection') return myCollection
        if (nftTab === 'Resale') return [...nftItems, ...myNftItems, ...myCollection].filter((n, i, arr) =>
            n.status === 'sold' && arr.findIndex(x => x.id === n.id) === i
        )
        return nftItems
    }, [nftItems, myNftItems, myCollection, nftTab])

    const nftFeedPosts = useMemo(() => (
        filteredNFTs.map((nft, idx) => ({
            id: nft.id,
            creator: {
                id: nft.creatorId || `nft-creator-${idx + 1}`,
                username: nft.creatorName || 'NFT Creator',
                handle: nft.creatorHandle || '@nftcreator',
                avatar: null,
                isFollowing: false,
            },
            media: {
                type: nft.mediaType || 'image',
                url: nft.mediaUrl || nft.thumbnail,
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

    const toggleBuyResell = async (nft) => {
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
                    const purchase = await buyNft(nft.id, nft.price, nft.title)
                    if (!purchase?.ok) {
                        setNftMessage(purchase?.message || 'Unable to buy NFT.')
                        return
                    }
                    
                    setNftMessage(`NFT bought successfully for ${displayPriceStr}.`)
                    setNftItems((state) => state.map((item) => 
                        item.id === nft.id 
                            ? { ...item, status: 'sold', buyer: '@globalcollector', soldAt: new Date().toISOString() } 
                            : item
                    ))
                    
                    // Re-fetch my collection so the new purchase shows up
                    const myCollRes = await postService.getMyCollection()
                    if (myCollRes.success && myCollRes.posts) {
                        setMyCollection(myCollRes.posts.map(post => mapPostToNFT(post)))
                    }
                },
                onCancel: () => setModalConfig(null)
            })
        } else if (nft.status === 'sold') {
            setModalConfig({
                type: 'prompt',
                title: 'Relist NFT',
                message: 'Enter your resale price:',
                defaultValue: nft.price * 1.2,
                onConfirm: (newPrice) => {
                    setModalConfig(null);
                    if (!newPrice) return;
                    
                    setNftMessage(`NFT "${nft.title}" successfully relisted for ${displayCurrency === 'USD' ? '$' + +(newPrice * 1.05 * (exchangeRates?.['INR'] ? (1 / exchangeRates['INR']) : (1 / 83))).toFixed(2) : '₹' + newPrice}.`)
                    setMyCollection((state) => state.map((item) =>
                        item.id === nft.id
                            ? { ...item, status: 'listed', price: Number(newPrice), listedAt: new Date().toISOString() }
                            : item
                    ))
                },
                onCancel: () => setModalConfig(null)
            })
        }
    }

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
        <div className="px-4 pt-4">
            <div className="mb-4">
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--color-text)' }}>{isNFTView ? 'NFT Marketplace' : 'Earn'}</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    {isNFTView ? 'Discover, buy, and relist creator collectibles globally' : 'Complete tasks, join voting, get paid'}
                </p>
            </div>

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
                <>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex gap-2">
                            {NFT_TABS.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setNftTab(tab)}
                                    className="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer"
                                    style={{
                                        background: nftTab === tab ? 'var(--color-primary)' : 'var(--color-surface)',
                                        color: nftTab === tab ? '#fff' : 'var(--color-muted)',
                                        border: `1px solid ${nftTab === tab ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setDisplayCurrency((v) => (v === 'INR' ? (profile?.currencyCode && profile.currencyCode !== 'INR' ? profile.currencyCode : 'USD') : 'INR'))}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
                        >
                            {displayCurrency}
                        </button>
                    </div>


                    {nftMessage && (
                        <p className="text-[11px] mb-3 font-medium" style={{ color: 'var(--color-text)' }}>
                            {nftMessage}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 pb-4">
                        {nftLoading ? (
                            [1, 2, 3, 4].map((n) => (
                                <div key={n} className="overflow-hidden rounded-2xl animate-pulse"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                    <div className="w-full aspect-square" style={{ background: 'var(--color-border)' }} />
                                    <div className="p-3 space-y-2">
                                        <div className="h-3 rounded" style={{ background: 'var(--color-border)', width: '70%' }} />
                                        <div className="h-3 rounded" style={{ background: 'var(--color-border)', width: '40%' }} />
                                    </div>
                                </div>
                            ))
                        ) : filteredNFTs.length === 0 ? (
                            <div className="col-span-2 py-12 text-center">
                                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                                    {nftTab === 'My Listings'
                                        ? 'You haven\'t minted any NFTs yet. Create a post and enable "Mint as NFT".'
                                        : nftTab === 'My Collection'
                                        ? 'Your collection is empty. Buy an NFT from Discover to start collecting.'
                                        : nftTab === 'Resale'
                                        ? 'No resale NFTs available yet.'
                                        : 'No NFTs found in the marketplace yet.'}
                                </p>
                            </div>
                        ) : null}
                        {!nftLoading && filteredNFTs.map((nft) => {
                            const isLocal = displayCurrency === 'INR';
                            const rateINR = exchangeRates?.['INR'] || 83;
                            const rateTarget = displayCurrency === 'USD' ? 1 : (exchangeRates?.[displayCurrency] || 1);
                            const converted = isLocal ? nft.price : (nft.price * 1.05 * (rateTarget / rateINR));
                            const valueStr = converted.toFixed(isLocal ? 0 : 2);
                            const symbol = isLocal ? '₹' : (displayCurrency === 'USD' ? '$' : (profile?.currencySymbol || displayCurrency));
                            const displayPriceStr = `${symbol}${valueStr}`;
                            return (
                                <div
                                    key={nft.id}
                                    className="overflow-hidden rounded-2xl"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                    onClick={() => {
                                        const idx = filteredNFTs.findIndex((item) => item.id === nft.id)
                                        if (idx >= 0) setActiveNftPostIndex(idx)
                                    }}
                                >
                                    <div className="w-full aspect-square bg-surface2 flex items-center justify-center overflow-hidden relative">
                                        {nft.mediaType === 'video' && nft.mediaUrl ? (
                                            <video
                                                src={nft.mediaUrl}
                                                className="w-full h-full object-cover"
                                                muted
                                                playsInline
                                                loop
                                                preload="none"
                                                poster={nft.thumbnail}
                                                onMouseEnter={(e) => e.target.play().catch(() => {})}
                                                onMouseLeave={(e) => {
                                                    e.target.pause();
                                                    e.target.currentTime = 0;
                                                }}
                                            />
                                        ) : (
                                            <img 
                                                src={nft.thumbnail || nft.mediaUrl || '/person.png'} 
                                                alt={nft.title} 
                                                className="w-full h-full object-cover" 
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/person.png';
                                                }}
                                            />
                                        )}
                                        {nft.postStatus === 'pending' && (
                                            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold"
                                                style={{ background: 'rgba(245,158,11,0.9)', color: '#fff' }}>
                                                PENDING REVIEW
                                            </div>
                                        )}
                                        {nft.postStatus === 'rejected' && (
                                            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold"
                                                style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}>
                                                REJECTED
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{nft.title}</p>
                                            <div className="mt-1 flex items-center justify-between">
                                                <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                                                    {displayPriceStr}
                                                </p>
                                            </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleBuyResell(nft)
                                            }}
                                            className="mt-2 w-full py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer"
                                            style={{ background: 'rgba(245,158,11,0.14)', color: 'var(--color-primary)' }}
                                        >
                                            {nft.status === 'listed' ? 'Buy (Global)' : 'Resell'}
                                        </button>
                                    </div>
                                </div>
                            )
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

                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        onClick={modalConfig.onCancel}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                        style={{ color: 'var(--color-text)', background: 'var(--color-background)', border: '1px solid var(--color-border)' }}
                                    >
                                        Cancel
                                    </button>
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
                                </div>
                            </motion.div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { mockNFTs } from '../data/mockNFTs'
import TaskCard from '../components/tasks/TaskCard'
import TaskDetailPage from './TaskDetailPage'
import PostFeedModal from '../components/feed/PostFeedModal'
import { useWalletStore } from '../store/useWalletStore'
import { useUserStore } from '../store/useUserStore'
import { usePlatformSettings } from '../hooks/usePlatformSettings'
import { getUserNFTListings } from '../../../shared/nftListings'
import { userCampaignService } from '../services/campaignService'
import { mapCampaignToTask } from '../utils/campaignMapper'
import { getJoinedCampaignIds, markCampaignJoined } from '../utils/campaignStorage'

const FILTERS = ['All', 'Active', 'Joined']
const NFT_TABS = ['Discover', 'My Listings', 'Resale']

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
    const [nftItems, setNftItems] = useState(mockNFTs)
    const [nftMessage, setNftMessage] = useState('')
    const [activeNftPostIndex, setActiveNftPostIndex] = useState(null)

    const { buyNft, addNftEarning } = useWalletStore()
    const { profile } = useUserStore()
    const platformSettings = usePlatformSettings()

    useEffect(() => {
        const hydrate = () => setNftItems([...mockNFTs, ...getUserNFTListings()])
        hydrate()
        const onUpdate = () => hydrate()
        const onStorage = (event) => {
            if (event.key === 'socialearn_user_nft_listings_v1') hydrate()
        }
        window.addEventListener('nft-listings-updated', onUpdate)
        window.addEventListener('storage', onStorage)
        return () => {
            window.removeEventListener('nft-listings-updated', onUpdate)
            window.removeEventListener('storage', onStorage)
        }
    }, [])

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
        if (nftTab === 'My Listings') return nftItems.filter((n) => n.status === 'listed')
        if (nftTab === 'Resale') return nftItems.filter((n) => n.status === 'sold')
        return nftItems
    }, [nftItems, nftTab])

    const nftFeedPosts = useMemo(() => (
        filteredNFTs.map((nft, idx) => ({
            id: `nft-post-${nft.id}`,
            creator: {
                id: nft.creatorId || `nft-creator-${idx + 1}`,
                username: nft.creatorName || 'NFT Creator',
                handle: nft.creatorHandle || '@nftcreator',
                avatar: null,
                isFollowing: false,
            },
            media: {
                type: 'image',
                url: nft.thumbnail,
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
        }))
    ), [filteredNFTs])

    const toggleBuyResell = (nft) => {
        setNftItems((state) =>
            state.map((item) => {
                if (item.id !== nft.id) return item
                if (item.status === 'listed') {
                    const purchase = buyNft(item.price, item.title)
                    if (!purchase?.ok) {
                        setNftMessage(purchase?.message || 'Unable to buy NFT.')
                        return item
                    }
                    const commission = Number(platformSettings.commission || 0)
                    if (item.creatorId === profile.id) {
                        addNftEarning(item.price, item.title)
                    }
                    setNftMessage(
                        item.creatorId === profile.id
                            ? `NFT sold. Commission ${commission}% deducted, net added to your earning wallet.`
                            : `NFT bought successfully for ₹${item.price}.`,
                    )
                    return { ...item, status: 'sold', buyer: '@globalcollector', soldAt: new Date().toISOString() }
                }
                setNftMessage('NFT relisted for sale.')
                return { ...item, status: 'listed', buyer: null, listedAt: new Date().toISOString() }
            }),
        )
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
                            <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>Loading campaigns...</p>
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
                            onClick={() => setDisplayCurrency((v) => (v === 'INR' ? 'USD' : 'INR'))}
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
                        {filteredNFTs.map((nft) => {
                            const usd = +(nft.price / 83).toFixed(2)
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
                                    <img src={nft.thumbnail} alt={nft.title} className="w-full aspect-square object-cover" />
                                    <div className="p-3">
                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{nft.title}</p>
                                        <div className="mt-1 flex items-center justify-between">
                                            <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                                                {displayCurrency === 'USD' ? `$${usd}` : `₹${nft.price}`}
                                            </p>
                                            <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>{nft.bids} bids</p>
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
                    />
                </>
            )}
        </div>
    )
}

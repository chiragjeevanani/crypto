import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Globe2, Trophy } from 'lucide-react'
import { mockTasks } from '../data/mockTasks'
import { mockNFTs } from '../data/mockNFTs'
import TaskCard from '../components/tasks/TaskCard'
import TaskDetail from '../components/tasks/TaskDetail'
import PostFeedModal from '../components/feed/PostFeedModal'
import { useCampaignStore } from '../store/useCampaignStore'
import { useWalletStore } from '../store/useWalletStore'
import { useUserStore } from '../store/useUserStore'
import { usePlatformSettings } from '../hooks/usePlatformSettings'
import { getUserNFTListings } from '../../../shared/nftListings'
import { getAdminCampaignsFromStorage, mapAdminCampaignToUserTask } from '../../../shared/adminCampaignSync'

const FILTERS = ['All', 'Active', 'Joined']
const NFT_TABS = ['Discover', 'My Listings', 'Resale']

export default function TasksPage() {
    const [searchParams] = useSearchParams()
    const view = searchParams.get('view')
    const isNFTView = view === 'nft'

    const [activeFilter, setActiveFilter] = useState('All')
    const [selectedTask, setSelectedTask] = useState(null)
    const [adminTasks, setAdminTasks] = useState([])

    const [nftTab, setNftTab] = useState('Discover')
    const [displayCurrency, setDisplayCurrency] = useState('INR')
    const [nftItems, setNftItems] = useState(mockNFTs)
    const [nftMessage, setNftMessage] = useState('')
    const [activeNftPostIndex, setActiveNftPostIndex] = useState(null)

    const { campaigns, voteSubmission, finalizeVoting } = useCampaignStore()
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
        const hydrateCampaigns = () => {
            const fromAdmin = getAdminCampaignsFromStorage().map((campaign, idx) => mapAdminCampaignToUserTask(campaign, idx))
            setAdminTasks(fromAdmin)
        }
        hydrateCampaigns()
        const onUpdate = () => hydrateCampaigns()
        const onStorage = (event) => {
            if (event.key === 'socialearn_admin_campaigns_v1') hydrateCampaigns()
        }
        window.addEventListener('admin-campaigns-updated', onUpdate)
        window.addEventListener('storage', onStorage)
        return () => {
            window.removeEventListener('admin-campaigns-updated', onUpdate)
            window.removeEventListener('storage', onStorage)
        }
    }, [])

    const allTasks = [...adminTasks, ...mockTasks]
    const filtered = allTasks.filter((t) => {
        if (activeFilter === 'Joined') return t.joined
        if (activeFilter === 'Active') return t.status === 'active'
        return true
    })

    const votingLive = campaigns.filter((c) => c.votingStatus === 'live').slice(0, 3)
    const recentWinners = campaigns.filter((c) => c.votingStatus === 'completed' && c.winner).slice(0, 3)

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
                        {filtered.map((task) => (
                            <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                        ))}
                        {filtered.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No tasks found</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 rounded-2xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <Globe2 size={16} style={{ color: 'var(--color-primary)' }} />
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Public Voting</p>
                        </div>
                        <div className="space-y-2.5">
                            {votingLive.map((campaign) => {
                                const top = campaign.submissions.slice(0, 2)
                                return (
                                    <div key={campaign.id} className="rounded-xl p-3" style={{ background: 'var(--color-surface2)' }}>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{campaign.title}</p>
                                        <div className="mt-2 space-y-1.5">
                                            {top.map((entry) => (
                                                <div key={entry.id} className="flex items-center justify-between">
                                                    <p className="text-xs" style={{ color: 'var(--color-sub)' }}>{entry.creatorHandle} · {entry.votes} votes</p>
                                                    <button
                                                        onClick={() => voteSubmission(campaign.id, entry.id)}
                                                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full cursor-pointer"
                                                        style={{ background: 'rgba(245,158,11,0.14)', color: 'var(--color-primary)' }}
                                                    >
                                                        Vote
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => finalizeVoting(campaign.id)}
                                            className="mt-2 text-[11px] font-semibold cursor-pointer"
                                            style={{ color: 'var(--color-primary)' }}
                                        >
                                            Finalize Winner (Demo)
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {recentWinners.length > 0 && (
                        <div className="mt-4 rounded-2xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <Trophy size={16} style={{ color: 'var(--color-success)' }} />
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Recent Winners</p>
                            </div>
                            <div className="space-y-2">
                                {recentWinners.map((campaign) => (
                                    <div key={campaign.id} className="flex items-center justify-between text-xs">
                                        <span style={{ color: 'var(--color-sub)' }}>{campaign.title}</span>
                                        <span style={{ color: 'var(--color-success)' }}>{campaign.winner?.creatorHandle}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <AnimatePresence>
                        {selectedTask && (
                            <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
                        )}
                    </AnimatePresence>
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

                    <p className="text-[11px] mb-3" style={{ color: 'var(--color-muted)' }}>
                        Policy enforced: NFT list price between $1 and $20. Admin commission: {platformSettings.commission}% on each sale.
                    </p>
                    {nftMessage && (
                        <p className="text-[11px] mb-3 font-medium" style={{ color: 'var(--color-text)' }}>
                            {nftMessage}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 pb-4">
                        {filteredNFTs.map((nft) => {
                            const usd = +(nft.price / 83).toFixed(2)
                            const inPolicy = usd >= 1 && usd <= 20
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
                                        <p className="text-[10px] mt-1" style={{ color: inPolicy ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                            {inPolicy ? 'Within $1–$20 policy' : 'Outside policy'}
                                        </p>
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

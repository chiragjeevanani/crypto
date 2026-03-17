import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
    Home,
    Search,
    Megaphone,
    Gem,
    Wallet,
    User,
    LogOut,
    PlusSquare,
    Trophy,
    PlayCircle,
} from 'lucide-react'
import BottomNavbar from '../components/shared/BottomNavbar'
import CoinRain from '../components/shared/CoinRain'
import RoseShower from '../components/shared/RoseShower'
import { useWalletStore } from '../store/useWalletStore'
import { useFeedStore } from '../store/useFeedStore'
import { useUserStore } from '../store/useUserStore'
import { formatINR, formatCurrency, formatCount } from '../utils/formatCurrency'
import { getKYCSubmissionByUser } from '../../../shared/kycSync'
import { mapCampaignToTask } from '../utils/campaignMapper'
import { userCampaignService } from '../services/campaignService'
import { getUserNFTListings } from '../../../shared/nftListings'

const SIDEBAR_ITEMS = [
    { label: 'Home', to: '/home', icon: Home, key: 'home' },
    { label: 'Search', to: '/search', icon: Search, key: 'search' },
    { label: 'Reels', to: '/home?view=reels', icon: PlayCircle, key: 'reels' },
    { label: 'Campaigns', to: '/campaigns', icon: Megaphone, key: 'campaigns' },
    { label: 'NFT Marketplace', to: '/tasks?view=nft', icon: Gem, key: 'nftMarket' },
    { label: 'Wallet', to: '/wallet', icon: Wallet, key: 'wallet' },
    { label: 'Profile', to: '/profile', icon: User, key: 'profile' },
    { label: 'Logout', to: '/logout', icon: LogOut, key: 'logout' },
]

export default function AppShell() {
    const navigate = useNavigate()
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)
    const view = searchParams.get('view')

    const { inrWallet, cryptoWallet, earningsWallet } = useWalletStore()
    const { posts, pushNotification } = useFeedStore()
    const { kyc, setKYCFromSync, user, profile } = useUserStore()

    const [activeCampaigns, setActiveCampaigns] = useState([])
    const [campaignLoading, setCampaignLoading] = useState(false)
    const [campaignError, setCampaignError] = useState('')
    const [screenTimeLabel, setScreenTimeLabel] = useState('0m')
    const [userNFTListings, setUserNFTListings] = useState([])
    const trendingNFTs = useMemo(() => {
        const nftPosts = posts
            .filter((post) => post.postType === 'nft' || post.isNFT || (post.nftPriceINR || 0) > 0)
            .map((post) => ({
                id: `post_${post.id}`,
                title: post.caption || 'NFT drop',
                price: post.nftPriceINR || 0,
                thumbnail: post.media?.url || '',
                likes: post.likes || 0,
                listedAt: post.createdAt || '',
                source: 'post',
            }))

        const nftListings = userNFTListings.map((listing) => ({
            id: `listing_${listing.id}`,
            title: listing.title,
            price: listing.price,
            thumbnail: listing.thumbnail || listing.mediaUrl || '',
            likes: listing.views || 0,
            listedAt: listing.listedAt,
            source: 'listing',
        }))

        return [...nftPosts, ...nftListings]
            .slice()
            .sort((a, b) => {
                const likeDiff = (b.likes || 0) - (a.likes || 0)
                if (likeDiff !== 0) return likeDiff
                const aTime = new Date(a.listedAt || 0).getTime() || 0
                const bTime = new Date(b.listedAt || 0).getTime() || 0
                return bTime - aTime
            })
            .slice(0, 3)
    }, [posts, userNFTListings])

    const leaderboard = posts
        .reduce((acc, post) => {
            const existing = acc.get(post.creator.id) || {
                id: post.creator.id,
                username: post.creator.username,
                handle: post.creator.handle,
                earnings: 0,
                likes: 0,
            }
            existing.earnings += post.earnings
            existing.likes += post.likes
            acc.set(post.creator.id, existing)
            return acc
        }, new Map())
        .values()

    const topCreators = Array.from(leaderboard)
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 4)

    const cryptoBalance = Number(cryptoWallet || 0).toFixed(4)
    const today = new Date().toISOString().slice(0, 10)
    const currencySymbol = profile?.currencySymbol || '₹'

    const todayEarnings = posts
        .filter((post) => String(post.createdAt || '').slice(0, 10) === today)
        .reduce((sum, post) => sum + (post.earnings || 0), 0)
    const todayEarningsLabel = formatCurrency(todayEarnings || 120, currencySymbol)

    const isItemActive = (item) => {
        if (item.key === 'home') return location.pathname === '/home' && !view
        if (item.key === 'search') return location.pathname === '/search'
        if (item.key === 'reels') return location.pathname === '/home' && view === 'reels'
        if (item.key === 'campaigns') return location.pathname.startsWith('/campaigns')
        if (item.key === 'nftMarket') return location.pathname === '/tasks' && view === 'nft'
        return location.pathname === item.to
    }

    // Keep KYC state synced app-wide after admin review actions.
    useEffect(() => {
        const hydrate = () => {
            const synced = getKYCSubmissionByUser(kyc.syncUserId)
            if (synced) setKYCFromSync(synced)
        }
        hydrate()
        const onSync = () => hydrate()
        const onStorage = (event) => {
            if (event.key === 'socialearn_kyc_sync_v1') hydrate()
        }
        window.addEventListener('kyc-sync-updated', onSync)
        window.addEventListener('storage', onStorage)
        return () => {
            window.removeEventListener('kyc-sync-updated', onSync)
            window.removeEventListener('storage', onStorage)
        }
    }, [kyc.syncUserId, setKYCFromSync])

    useEffect(() => {
        const seenCampaignKey = 'socialearn_seen_campaign_ids_v1'
        let mounted = true
        const hydrateCampaigns = async () => {
            setCampaignLoading(true)
            try {
                const list = await userCampaignService.listActive()
                const mapped = (list || []).map((campaign) => mapCampaignToTask(campaign))
                if (!mounted) return
                setActiveCampaigns(mapped)
                setCampaignError('')

                const ids = mapped.map((task) => String(task.campaignId || task.id))
                const seenRaw = window.localStorage.getItem(seenCampaignKey)
                const seen = new Set(seenRaw ? JSON.parse(seenRaw) : [])
                const newCampaigns = mapped.filter((task) => !seen.has(String(task.campaignId || task.id)))

                if (seen.size > 0 && newCampaigns.length > 0) {
                    newCampaigns.forEach((task) => {
                        pushNotification({
                            type: 'campaign',
                            title: 'New campaign added',
                            subtitle: `${task.title} is now live.`,
                        })
                    })
                }

                const updatedSeen = [...new Set([...Array.from(seen), ...ids])]
                window.localStorage.setItem(seenCampaignKey, JSON.stringify(updatedSeen))
            } catch (error) {
                if (!mounted) return
                setActiveCampaigns([])
                setCampaignError(error?.message || 'Failed to load campaigns')
            } finally {
                if (mounted) setCampaignLoading(false)
            }
        }
        hydrateCampaigns()
        return () => {
            mounted = false
        }
    }, [pushNotification])

    useEffect(() => {
        const key = 'socialearn_screen_time_start_v1'
        const todayKey = new Date().toISOString().slice(0, 10)
        const startValue = window.localStorage.getItem(key)
        const parsed = startValue ? JSON.parse(startValue) : null
        if (!parsed || parsed.day !== todayKey) {
            window.localStorage.setItem(key, JSON.stringify({ day: todayKey, startAt: Date.now() }))
        }

        const formatDuration = (ms) => {
            const totalMinutes = Math.max(0, Math.floor(ms / 60000))
            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60
            if (hours === 0) return `${minutes}m`
            return `${hours}h ${minutes}m`
        }

        const tick = () => {
            const raw = window.localStorage.getItem(key)
            const current = raw ? JSON.parse(raw) : { day: todayKey, startAt: Date.now() }
            setScreenTimeLabel(formatDuration(Date.now() - Number(current.startAt || Date.now())))
        }

        tick()
        const timer = window.setInterval(tick, 30000)
        return () => window.clearInterval(timer)
    }, [])

    useEffect(() => {
        const hydrate = () => setUserNFTListings(getUserNFTListings())
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

    return (
        <div
            className="app-shell relative flex flex-col h-screen w-full overflow-hidden"
            style={{ background: 'var(--color-bg)' }}
        >
            <aside
                className="desktop-sidebar hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-[84px] lg:w-[248px] md:border-r md:px-3 md:py-6"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
                <div className="flex items-center justify-center lg:justify-start lg:px-2 mb-7">
                    <span className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--color-primary)' }}>
                        <span className="hidden lg:inline">SocialEarn</span>
                        <span className="lg:hidden">SE</span>
                    </span>
                </div>

                <nav className="flex flex-col gap-2">
                    {SIDEBAR_ITEMS.map((item) => {
                        const Icon = item.icon
                        const active = isItemActive(item)
                        return (
                            <Link
                                key={item.label}
                                to={item.to}
                                title={item.label}
                                className={`desktop-menu-item flex items-center justify-center lg:justify-start gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-200 ease-out ${active ? 'font-semibold' : ''}`}
                                style={{
                                    color: active ? 'var(--color-text)' : 'var(--color-muted)',
                                    background: active ? 'rgba(245,158,11,0.14)' : 'transparent',
                                    boxShadow: active ? 'inset 3px 0 0 var(--color-primary)' : 'none',
                                }}
                            >
                                <Icon size={19} />
                                <span className="hidden lg:inline text-sm">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="mt-auto space-y-2">
                    <Link
                        to="/create"
                        className="desktop-upload-btn flex items-center justify-center lg:justify-center gap-2 w-full rounded-xl py-2.5 font-semibold text-sm transition-all duration-200 ease-out"
                        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))', color: '#fff' }}
                    >
                        <PlusSquare size={18} />
                        <span className="hidden lg:inline">Upload</span>
                    </Link>
                    <div className="hidden lg:block px-2 py-2 rounded-xl text-center" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
                        <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--color-text)' }}>{user?.name || 'User'}</p>
                        <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>User account</p>
                    </div>
                </div>
            </aside>

            <main className="app-shell-main flex-1 overflow-y-auto hide-scrollbar pb-safe md:pb-6 md:ml-[84px] md:px-4 lg:ml-[248px] lg:mr-[300px] lg:px-6 xl:mr-[332px]">
                <div className="mx-auto w-full md:max-w-[620px] lg:max-w-[680px]">
                    <Outlet />
                </div>
            </main>

            <aside
                className="hidden lg:block lg:fixed lg:top-0 lg:right-0 lg:h-screen lg:w-[300px] xl:w-[332px] lg:overflow-y-auto lg:p-5"
                style={{ background: 'var(--color-bg)' }}
            >
                <div className="space-y-5 pb-6">
                    <div className="px-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-muted)' }}>
                            Earnings Summary
                        </p>
                    </div>

                    <section className="desktop-panel-card overflow-hidden rounded-2xl p-0">
                        <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.16), rgba(249,115,22,0.10))' }}>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-primary)' }}>
                                    Wallet Summary
                                </p>
                            <p className="mt-1 text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>
                                {formatCurrency(earningsWallet, currencySymbol)}
                            </p>
                            <div className="mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-success)' }}>
                                +{todayEarningsLabel} today
                            </div>
                        </div>
                        <div className="space-y-2 px-5 py-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span style={{ color: 'var(--color-sub)' }}>INR Balance</span>
                                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(inrWallet, currencySymbol)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span style={{ color: 'var(--color-sub)' }}>Crypto Balance</span>
                                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{cryptoBalance} ETH</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span style={{ color: 'var(--color-sub)' }}>Earning Balance</span>
                                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(earningsWallet, currencySymbol)}</span>
                            </div>
                        </div>
                    </section>

                    <section className="desktop-panel-card rounded-2xl p-4">
                        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Screen Time</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Today</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-primary)' }}>{screenTimeLabel}</p>
                    </section>

                    <section className="desktop-panel-card rounded-2xl p-4">
                        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Campaigns</p>
                        <div className="space-y-2.5">
                            {campaignLoading && (
                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Loading campaigns...</p>
                            )}
                            {campaignError && !campaignLoading && (
                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{campaignError}</p>
                            )}
                            {!campaignLoading && !campaignError && activeCampaigns.length === 0 && (
                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No active campaigns yet.</p>
                            )}
                            {!campaignLoading && !campaignError && activeCampaigns.map((task) => {
                                const participantCount = Number(task.participants || 0)
                                const capacity = Number(task.maxParticipants || 0)
                                const progressPct = capacity > 0
                                    ? Math.round((participantCount / capacity) * 100)
                                    : (participantCount > 0 ? 100 : 0)
                                const taskLabel = task.steps?.[0]?.label || task.taskInstructions || task.description || task.title
                                return (
                                    <button
                                        key={task.id}
                                        onClick={() => navigate(`/tasks/${encodeURIComponent(task.id)}`)}
                                        className="w-full text-left rounded-xl p-3.5 cursor-pointer"
                                        style={{ background: 'var(--color-surface2)' }}
                                    >
                                        {task.backgroundImage && (
                                            <img
                                                src={task.backgroundImage}
                                                alt={task.title}
                                                className="w-full h-20 object-cover rounded-lg mb-2"
                                            />
                                        )}
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{task.brand.name}</p>
                                            <p className="text-[11px] font-semibold" style={{ color: 'var(--color-primary)' }}>
                                                {Math.min(100, progressPct)}%
                                            </p>
                                        </div>
                                        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{taskLabel}</p>
                                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(245,158,11,0.16)' }}>
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${Math.min(100, progressPct)}%`,
                                                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary2))',
                                                }}
                                            />
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    <section className="desktop-panel-card rounded-2xl p-4">
                        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Trending NFTs</p>
                        <div className="space-y-2.5">
                            {trendingNFTs.length === 0 && (
                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No NFTs yet.</p>
                            )}
                            {trendingNFTs.map((post) => (
                                <div
                                    key={post.id}
                                    className="rounded-xl p-2.5 transition-all duration-200 ease-out hover:-translate-y-0.5"
                                    style={{ background: 'var(--color-surface2)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={post.thumbnail} alt={post.title || 'NFT'} className="h-11 w-11 rounded-lg object-cover" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                                {post.title || 'NFT drop'}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--color-primary)' }}>
                                                {formatCurrency(post.price || 0, currencySymbol)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="desktop-panel-card rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Trophy size={15} style={{ color: 'var(--color-primary)' }} />
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Creator Leaderboard</p>
                        </div>
                        <div className="space-y-2.5">
                            {topCreators.map((creator, idx) => (
                                <div key={creator.id} className="flex items-center justify-between rounded-xl p-2.5" style={{ background: 'var(--color-surface2)' }}>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold"
                                            style={{
                                                background: idx === 0 ? 'rgba(245,158,11,0.16)' : 'rgba(245,158,11,0.12)',
                                                color: '#d97706',
                                            }}
                                        >
                                            {idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                                {creator.username}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{creator.handle}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>{formatCurrency(creator.earnings, currencySymbol)}</p>
                                        <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>{formatCount(creator.likes)} likes</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </aside>

            <div className="md:hidden">
                <BottomNavbar />
            </div>

            <CoinRain />
            <RoseShower />
        </div>
    )
}

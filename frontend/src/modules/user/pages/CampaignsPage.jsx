import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, Trophy } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { userCampaignService } from '../services/campaignService'

export default function CampaignsPage() {
    const navigate = useNavigate()
    const { campaigns: votedCampaigns } = useCampaignStore()
    const [campaigns, setCampaigns] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const load = async () => {
            setLoading(true)
            try {
                const list = await userCampaignService.listActive()
                if (mounted) setCampaigns(list || [])
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [])
    const recentWinners = votedCampaigns.filter((item) => item.votingStatus === 'completed' && item.winner).slice(0, 6)

    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const BACKEND_URL = API_BASE.replace(/\/api\/?$/, '');

    return (
        <div className="px-4 pt-4 pb-20">
            <div className="mb-4">
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--color-text)' }}>Campaigns</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    Browse live campaigns and recent winners.
                </p>
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <Megaphone size={16} style={{ color: 'var(--color-primary)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Live Campaigns</p>
                </div>
                <div className="space-y-2.5">
                    {loading && (
                        <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>Loading campaigns...</p>
                    )}
                    {!loading && campaigns.length === 0 && (
                        <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>No active campaigns.</p>
                    )}
                    {campaigns.map((campaign) => {
                        const bannerUrlRaw = String(campaign.bannerUrl || '').trim();
                        const resolvedUrl = bannerUrlRaw ? (
                            /^https?:\/\//i.test(bannerUrlRaw) || /^data:/i.test(bannerUrlRaw)
                                ? bannerUrlRaw 
                                : `${BACKEND_URL}${bannerUrlRaw.startsWith('/') ? '' : '/'}${bannerUrlRaw}`
                        ) : null;
                        
                        return (
                        <div
                            key={campaign.id}
                            className="w-full rounded-xl p-3 flex items-center justify-between gap-3"
                            style={{ background: 'var(--color-surface2)' }}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {resolvedUrl && (
                                    <img src={resolvedUrl} alt={campaign.title} className="w-14 h-14 rounded-lg object-cover" />
                                )}
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{campaign.title}</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{campaign.brandName}</p>
                                    <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
                                        Prize: {campaign.rewardDetails}
                                    </p>
                                    <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
                                        Ends: {String(campaign.endDate || '').slice(0, 10)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(`/campaigns/${campaign.id}`)}
                                className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                                style={{ background: 'rgba(245,158,11,0.14)', color: 'var(--color-primary)' }}
                            >
                                Join Campaign
                            </button>
                        </div>
                    )})}
                </div>
            </div>

            <div className="mt-4 rounded-2xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <Trophy size={16} style={{ color: 'var(--color-success)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Task Winner List</p>
                </div>
                <div className="space-y-2">
                    {recentWinners.length === 0 && (
                        <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>No winners yet.</p>
                    )}
                    {recentWinners.map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between text-xs">
                            <span style={{ color: 'var(--color-sub)' }}>{campaign.title}</span>
                            <span style={{ color: 'var(--color-success)' }}>{campaign.winner?.creatorHandle}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

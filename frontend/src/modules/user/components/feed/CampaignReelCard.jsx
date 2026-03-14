import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function CampaignReelCard({ campaign }) {
    const navigate = useNavigate()
    if (!campaign) return null

    return (
        <div className="relative flex flex-col h-full items-center justify-center bg-black">
            <div className="relative w-full max-w-sm mx-auto aspect-[9/16] overflow-hidden bg-black max-h-[80vh]">
                <div className="absolute inset-0">
                    {campaign.bannerUrl ? (
                        <img src={campaign.bannerUrl} alt={campaign.title} className="w-full h-full object-cover opacity-90" />
                    ) : (
                        <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.45), rgba(249,115,22,0.2))' }} />
                    )}
                    <div className="absolute inset-0 bg-black/35" />
                </div>

                <div className="absolute inset-0 flex flex-col justify-between p-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                        style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--color-primary)' }}>
                        <Sparkles size={12} />
                        Sponsored Campaign
                    </div>

                    <div className="rounded-2xl p-4" style={{ background: 'rgba(12,12,12,0.72)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
                            {campaign.brandName}
                        </p>
                        <h3 className="text-lg font-bold mt-1 text-white">{campaign.title}</h3>
                        <p className="text-[12px] mt-2 text-white/80 line-clamp-3">{campaign.description}</p>
                        <div className="mt-3 flex items-center justify-between">
                            <div className="text-[11px] text-white/80">
                                Prize: <span className="text-white font-semibold">{campaign.rewardDetails}</span>
                            </div>
                            <button
                                onClick={() => navigate(`/campaigns/${campaign.id}`)}
                                className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                                style={{ background: 'var(--color-primary)', color: '#111' }}
                            >
                                Join Campaign
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

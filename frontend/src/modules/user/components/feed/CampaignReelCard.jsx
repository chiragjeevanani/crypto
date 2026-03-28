import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function CampaignReelCard({ campaign }) {
    const navigate = useNavigate()
    if (!campaign) return null

    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const BACKEND_URL = API_BASE.replace(/\/api\/?$/, '');

    const bannerUrlRaw = String(campaign.bannerUrl || '').trim();
    const resolvedBannerUrl = bannerUrlRaw ? (
        /^https?:\/\//i.test(bannerUrlRaw) || /^data:/i.test(bannerUrlRaw)
            ? bannerUrlRaw 
            : `${BACKEND_URL}${bannerUrlRaw.startsWith('/') ? '' : '/'}${bannerUrlRaw}`
    ) : null;

    // Fallback detection for video files
    const isVideo = campaign.bannerType === 'video' || 
                   /\.(mp4|webm|mov|ogg)$/i.test(bannerUrlRaw);

    return (
        <div className="relative flex flex-col h-full items-center justify-center bg-black">
            <div className="relative w-full h-full mx-auto overflow-hidden bg-black md:h-auto md:aspect-[9/16] md:max-w-[520px] lg:max-w-[560px] lg:max-h-[calc(100vh-56px)]">
                <div className="absolute inset-0 z-0">
                    {resolvedBannerUrl ? (
                        isVideo ? (
                            <video 
                                src={resolvedBannerUrl} 
                                className="w-full h-full object-cover" 
                                muted 
                                playsInline 
                                loop 
                                autoPlay 
                                preload="auto"
                                crossOrigin="anonymous"
                            />
                        ) : (
                            <img 
                                src={resolvedBannerUrl} 
                                alt={campaign.title} 
                                className="w-full h-full object-cover opacity-90" 
                                loading="lazy" 
                            />
                        )
                    ) : (
                        <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.45), rgba(249,115,22,0.2))' }} />
                    )}
                    <div className="absolute inset-0 bg-black/45" />
                </div>

                <div className="absolute inset-x-0 top-0 bottom-[var(--reels-bottom-offset,80px)] flex flex-col justify-between p-4 px-5 z-10">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider w-fit mt-12 md:mt-2"
                        style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--color-primary)' }}>
                        <Sparkles size={12} />
                        Sponsored Campaign
                    </div>

                    <div className="rounded-2xl p-4 shadow-2xl" style={{ 
                        background: 'rgba(12,12,12,0.85)', 
                        border: '1px solid rgba(255,255,255,0.12)',
                        backdropFilter: 'blur(8px)'
                    }}>
                        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
                            {campaign.brandName}
                        </p>
                        <h3 className="text-lg font-extrabold mt-1 text-white leading-tight">{campaign.title}</h3>
                        <p className="text-[12px] mt-2 text-white/80 line-clamp-2 leading-relaxed">{campaign.description}</p>
                        <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-3">
                            <div className="text-[11px] text-zinc-400">
                                Prize: <span className="text-white font-bold">{campaign.rewardDetails}</span>
                            </div>
                            <button
                                onClick={() => navigate(`/campaigns/${campaign.id}`)}
                                className="px-4 py-2 rounded-full text-[11px] font-bold transition-transform active:scale-95"
                                style={{ background: 'var(--color-primary)', color: '#000' }}
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

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CampaignHomeCard({ campaign }) {
    const navigate = useNavigate()
    const [imgError, setImgError] = useState(false)

    if (!campaign) return null

    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const BACKEND_URL = API_BASE.replace(/\/api\/?$/, '');

    const bannerUrlRaw = String(campaign.bannerUrl || '').trim();
    const resolvedBannerUrl = bannerUrlRaw ? (
        /^https?:\/\//i.test(bannerUrlRaw) || /^data:/i.test(bannerUrlRaw)
            ? bannerUrlRaw 
            : `${BACKEND_URL}${bannerUrlRaw.startsWith('/') ? '' : '/'}${bannerUrlRaw}`
    ) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-4 my-6 rounded-3xl overflow-hidden shadow-xl"
            style={{ 
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)'
            }}
        >
            <div className="relative aspect-[16/9] overflow-hidden">
                {resolvedBannerUrl ? (
                    campaign.bannerType === 'video' ? (
                        <video 
                            src={resolvedBannerUrl} 
                            className="w-full h-full object-cover" 
                            muted
                            playsInline
                            loop
                            autoPlay
                        />
                    ) : (
                        <img 
                            src={resolvedBannerUrl} 
                            alt={campaign.title} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                                // Double check if it fails even after resolution
                                if (!imgError) {
                                  console.error("Campaign image failed to load:", resolvedBannerUrl);
                                  setImgError(true);
                                }
                            }}
                        />
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                        <Sparkles size={40} className="text-white/20" />
                    </div>
                )}
                {imgError && resolvedBannerUrl && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                      <Sparkles size={40} className="text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <Sparkles size={12} className="text-yellow-400" />
                    Recommended Campaign
                </div>
            </div>

            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1" style={{ color: 'var(--color-text)' }}>
                            {campaign.brandName}
                        </p>
                        <h3 className="text-lg font-extrabold leading-tight mb-2" style={{ color: 'var(--color-text)' }}>
                            {campaign.title}
                        </h3>
                        <p className="text-xs line-clamp-2 opacity-80" style={{ color: 'var(--color-sub)' }}>
                            {campaign.description}
                        </p>
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Reward</p>
                        <p className="text-sm font-black" style={{ color: 'var(--color-primary)' }}>{campaign.rewardDetails}</p>
                    </div>
                    <button
                        onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'var(--color-primary)', color: '#fff' }}
                    >
                        Participate Now
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

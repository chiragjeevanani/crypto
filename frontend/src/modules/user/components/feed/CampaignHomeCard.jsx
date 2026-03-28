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
            onClick={() => navigate(`/campaigns/${campaign.id}`)}
            className="mx-4 my-6 rounded-[32px] overflow-hidden shadow-2xl relative cursor-pointer group"
            style={{ 
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                height: '320px'
            }}
        >
            {/* Full Background Media */}
            <div className="absolute inset-0 z-0 bg-bg/50">
                {resolvedBannerUrl ? (
                    <>
                        {campaign.bannerType === 'video' ? (
                            <video 
                                src={resolvedBannerUrl} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                muted
                                playsInline
                                loop
                                autoPlay
                                preload="metadata"
                                crossOrigin="anonymous"
                            />
                        ) : (
                            <img 
                                src={resolvedBannerUrl} 
                                alt={campaign.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                loading="lazy"
                                onError={() => setImgError(true)}
                            />
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                        <Sparkles size={40} className="text-white/20" />
                    </div>
                )}
                
                {/* Fallback for error */}
                {imgError && resolvedBannerUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                      <Sparkles size={40} className="text-white/20" />
                  </div>
                )}

                {/* Darker Overlays for Text Legibility */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            </div>

            {/* Status Tags */}
            <div className="absolute top-5 left-5 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-xl bg-black/40 border border-white/10 text-white shadow-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                Featured Campaign
            </div>

            {/* Reward Badge */}
            <div className="absolute top-5 right-5 z-20 px-3 py-1.5 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 text-white shadow-lg">
                <p className="text-[8px] uppercase tracking-widest font-black opacity-70">Reward Pool</p>
                <p className="text-sm font-black text-emerald-400">{campaign.rewardDetails}</p>
            </div>

            {/* Bottom Content (Glassmorphism Overlay) */}
            <div className="absolute bottom-0 inset-x-0 z-20 p-6 pt-10">
                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary drop-shadow-md">
                        {campaign.brandName}
                    </p>
                    <h3 className="text-2xl font-black leading-tight text-white drop-shadow-xl line-clamp-2">
                        {campaign.title}
                    </h3>
                    <p className="text-xs text-white/70 line-clamp-2 leading-relaxed max-w-[90%] font-medium">
                        {campaign.description}
                    </p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-wider text-white">Join Now</span>
                        <ArrowRight size={14} className="text-white translate-x-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

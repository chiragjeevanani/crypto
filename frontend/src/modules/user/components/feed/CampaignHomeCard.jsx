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
            className="mx-3 my-6 rounded-[32px] overflow-hidden shadow-xl relative cursor-pointer group bg-surface border border-surface2/50"
        >
            {/* Brand Header */}
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-surface2/30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {campaign.brandName?.charAt(0) || 'B'}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">{campaign.brandName}</p>
                        <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Campaign Creator</p>
                    </div>
                </div>
                <div className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Active
                </div>
            </div>

            {/* Media Area */}
            <div className="relative aspect-[16/10] bg-black/5 overflow-hidden">
                {resolvedBannerUrl ? (
                    <>
                        {campaign.bannerType === 'video' ? (
                            <video 
                                src={resolvedBannerUrl} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                muted playsInline loop preload="none" crossOrigin="anonymous"
                                onMouseEnter={(e) => e.target.play().catch(() => {})}
                                onMouseLeave={(e) => {
                                    e.target.pause();
                                    e.target.currentTime = 0;
                                }}
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
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-surface2">
                        <Sparkles size={40} className="text-primary/20" />
                    </div>
                )}
                
                {/* Status Tags Overlay on Image */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-md bg-black/60 border border-white/10 text-white shadow-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    Featured
                </div>

                <div className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-xl backdrop-blur-md bg-black/60 border border-white/10 text-white shadow-lg">
                    <p className="text-[7px] uppercase tracking-widest font-black opacity-70">Reward Pool</p>
                    <p className="text-xs font-black text-emerald-400">{campaign.rewardDetails}</p>
                </div>
            </div>

            {/* Details Section (Below Image) */}
            <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                    <h3 className="text-lg font-black leading-tight text-text line-clamp-2">
                        {campaign.title}
                    </h3>
                    <p className="text-[11px] text-muted line-clamp-3 leading-relaxed font-medium">
                        {campaign.description}
                    </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-surface bg-surface2 flex items-center justify-center text-[8px] font-bold text-muted">
                                {i}
                            </div>
                        ))}
                        <div className="w-6 h-6 rounded-full border-2 border-surface bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                            +1k
                        </div>
                    </div>
                    
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 group-hover:shadow-primary/40">
                        <span className="text-[11px] font-black uppercase tracking-[0.1em]">Join Now</span>
                        <ArrowRight size={14} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

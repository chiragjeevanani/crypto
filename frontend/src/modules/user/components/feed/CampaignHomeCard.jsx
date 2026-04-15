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
            className="mx-3 my-4 rounded-[32px] overflow-hidden shadow-xl relative cursor-pointer group bg-surface border border-surface2/50"
        >
            {/* Media Area with Overlay */}
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
                
                {/* Brand Header Overlay */}
                <div className="absolute top-4 left-5 z-20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-white/30 backdrop-blur-lg bg-black/20 overflow-hidden flex items-center justify-center p-1 shadow-lg">
                         <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-[10px] font-black text-primary">{campaign.brandName?.charAt(0) || 'B'}</span>
                         </div>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white leading-none drop-shadow-md">
                            {campaign.brandName}
                        </p>
                        <p className="text-[7px] font-bold text-white/70 uppercase tracking-widest mt-1">Official Campaign</p>
                    </div>
                </div>

                {/* Gradient Overlays */}
                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/60 to-transparent z-10" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent z-10" />

                {/* Title Overlay on Bottom of Image */}
                <div className="absolute bottom-4 left-5 z-20">
                    <h3 className="text-xl font-black text-white leading-tight line-clamp-1 drop-shadow-lg">
                        {campaign.title}
                    </h3>
                </div>

                {/* Status/Rewards Overlay */}
                <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20 shadow-xl">
                    <p className="text-[8px] font-black text-amber-400 uppercase tracking-[0.2em]">{campaign.rewardDetails}</p>
                </div>
            </div>

            {/* Details Section (Restored Bottom) */}
            <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                    <p className="text-[11px] text-muted line-clamp-2 leading-relaxed font-medium">
                        {campaign.description}
                    </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className="flex -space-x-1.5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-5 h-5 rounded-full border-2 border-surface bg-surface2 flex items-center justify-center text-[7px] font-black text-muted">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                        <div className="w-5 h-5 rounded-full border-2 border-surface bg-primary/20 flex items-center justify-center text-[7px] font-black text-primary">
                            +1k
                        </div>
                    </div>
                    
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95">
                        <span className="text-[10px] font-black uppercase tracking-wider">Join Now</span>
                        <ArrowRight size={12} />
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

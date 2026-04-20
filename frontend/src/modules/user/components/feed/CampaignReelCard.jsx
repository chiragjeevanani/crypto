import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Volume2, VolumeX } from 'lucide-react'
import { optimizeCloudinaryUrl } from '../../../../utils/mediaOptimization'

export default function CampaignReelCard({ campaign, active }) {
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

    const [isMuted, setIsMuted] = useState(true)
    const [showMuteIndicator, setShowMuteIndicator] = useState(false)
    const videoRef = useRef(null)
    const audioRef = useRef(null)

    const toggleMute = (e) => {
        if (e) e.stopPropagation()
        const nextMuted = !isMuted
        setIsMuted(nextMuted)
        
        if (audioRef.current) {
            audioRef.current.muted = nextMuted
            if (!nextMuted) audioRef.current.play().catch(() => {})
        }
        if (videoRef.current) {
            videoRef.current.muted = nextMuted
            if (!nextMuted) videoRef.current.play().catch(() => {})
        }

        setShowMuteIndicator(true)
        setTimeout(() => setShowMuteIndicator(false), 800)
    }

    useEffect(() => {
        let isCurrent = true
        const video = videoRef.current
        const audio = audioRef.current

        if (active) {
            if (video) {
                video.muted = isMuted
                video.play().catch(() => {})
            }
            if (audio) {
                audio.muted = isMuted
                audio.play().catch(() => {})
            }
        } else {
            if (video) {
                video.pause()
                video.currentTime = 0
            }
            if (audio) {
                audio.pause()
                audio.currentTime = 0
            }
        }

        return () => {
            isCurrent = false
            if (video) video.pause()
            if (audio) audio.pause()
        }
    }, [active, isMuted])

    return (
        <div className="relative flex flex-col h-full items-center justify-center bg-black">
            <div className="relative w-full h-full mx-auto overflow-hidden bg-black md:h-auto md:aspect-[9/16] md:max-w-[520px] lg:max-w-[560px] lg:max-h-[calc(100vh-56px)]">
                <div className="absolute inset-0 z-0">
                    {resolvedBannerUrl ? (
                        isVideo ? (
                            <video 
                                key={`vid-${campaign.id}`}
                                ref={videoRef}
                                src={`${optimizeCloudinaryUrl(resolvedBannerUrl, { isVideo: true, width: 720, quality: '60' })}${resolvedBannerUrl.includes('?') ? '&' : '?'}v=${Date.now()}`} 
                                className="w-full h-full object-cover cursor-pointer" 
                                muted={isMuted} 
                                playsInline 
                                loop 
                                preload="auto"
                                crossOrigin="anonymous"
                                poster={optimizeCloudinaryUrl(resolvedBannerUrl, { isVideo: true, width: 480, quality: '50' })}
                                onClick={toggleMute}
                            />
                        ) : (
                            <img 
                                key={`img-${campaign.id}`}
                                src={resolvedBannerUrl} 
                                alt={campaign.title} 
                                className="w-full h-full object-cover opacity-90" 
                                loading="lazy" 
                                onClick={toggleMute}
                            />
                        )
                    ) : (
                        <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.45), rgba(249,115,22,0.2))' }} />
                    )}
                    <div className="absolute inset-0 bg-black/45" onClick={toggleMute} />

                    <AnimatePresence>
                        {showMuteIndicator && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                            >
                                <div className="bg-black/40 p-4 rounded-full text-white">
                                    {isMuted ? <VolumeX size={32} /> : <Volume2 size={32} />}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Persistent Volume Toggle */}
                    <button 
                        onClick={toggleMute}
                        className="absolute right-3 z-30 p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 transition-transform active:scale-90"
                        style={{ bottom: 'calc(8px + var(--reels-bottom-offset, 64px))' }}
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>

                    {campaign.musicData && (
                        <audio
                            ref={audioRef}
                            src={`${campaign.musicData.audioUrl}${campaign.musicData.audioUrl.includes('?') ? '&' : '?'}v=${Date.now()}`}
                            type="audio/mpeg"
                            loop
                            muted={isMuted}
                            preload="none"
                        />
                    )}
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

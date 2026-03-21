import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function SuggestedReelsSection({ reels = [] }) {
    const navigate = useNavigate()
    if (!reels || reels.length === 0) return null

    return (
        <div className="py-4">
            <div className="flex items-center justify-between mb-4 px-4">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text-dark, #000)' }}>Suggested Reels</span>
                </div>
                <button 
                  onClick={() => navigate('/home?view=reels')}
                  className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                    See more
                </button>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar px-4">
                {/* Looping logic: repeat the list multiple times to give an infinite feel for limited reels */}
                {[...reels, ...reels, ...reels].slice(0, 24).map((reel, idx) => (
                    <div 
                        key={`${reel.id}-${idx}`} 
                        className="relative w-36 aspect-[9/16] shrink-0 rounded-xl overflow-hidden group cursor-pointer transition-transform active:scale-95"
                        style={{ border: '1px solid var(--color-border)' }}
                        onClick={() => navigate(`/home?view=reels&post=${reel.id}`)}
                    >
                        <video 
                            src={reel.media?.url}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            muted
                            playsInline
                            loop
                            preload="metadata"
                            crossOrigin="anonymous"
                            poster={reel.media?.thumbnail || reel.media?.poster}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2 flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-white truncate w-full">
                                {reel.creator?.username}
                            </span>
                            <span className="text-[9px] text-white/70 truncate w-full">
                                {reel.caption}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

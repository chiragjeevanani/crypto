import { useNavigate } from 'react-router-dom'
import { Sparkles, Play } from 'lucide-react'
import { optimizeCloudinaryUrl } from '../../../../utils/mediaOptimization'

// Poster for a reel tile. Falls back through the same chain the feed uses, and
// returns '' rather than letting optimizeCloudinaryUrl hand back its
// '/person.png' avatar placeholder, which makes no sense on a reel tile.
function posterFor(reel) {
    const raw = reel?.media?.thumbnailUrl || reel?.media?.thumbnail || reel?.media?.poster
    if (!raw) return ''
    return optimizeCloudinaryUrl(raw, { width: 400, quality: '50' })
}

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
                {/* Poster images, not <video>. This rail used to render the list
                    three times over (up to 24 tiles) with `autoPlay loop` on every
                    one — so ~10 unique full-size originals decoded and looped
                    forever from the moment the home feed mounted, and never paused
                    when scrolled away. They competed for the browser's decoders and
                    its per-origin connection budget with the feed video the user was
                    actually watching, which is a large part of why feed videos
                    stuttered while the reels viewer stayed smooth. Tapping a tile
                    already opens the reels viewer, so nothing here needs to move. */}
                {reels.map((reel) => {
                    const poster = posterFor(reel)
                    return (
                        <div
                            key={reel.id}
                            className="relative w-36 aspect-[9/16] shrink-0 rounded-xl overflow-hidden group cursor-pointer transition-transform active:scale-95 bg-black/10"
                            style={{ border: '1px solid var(--color-border)' }}
                            onClick={() => navigate(`/home?view=reels&post=${reel.id}`)}
                        >
                            {poster ? (
                                <img
                                    src={poster}
                                    alt=""
                                    aria-hidden="true"
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    loading="lazy"
                                    decoding="async"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--color-surface2)' }}>
                                    <Play size={22} style={{ color: 'var(--color-muted)' }} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center">
                                <Play size={11} className="text-white" fill="currentColor" />
                            </div>
                            <div className="absolute bottom-2 left-2 right-2 flex flex-col min-w-0">
                                <span className="text-[10px] font-bold text-white truncate w-full">
                                    {reel.creator?.username}
                                </span>
                                <span className="text-[9px] text-white/70 truncate w-full">
                                    {reel.caption}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

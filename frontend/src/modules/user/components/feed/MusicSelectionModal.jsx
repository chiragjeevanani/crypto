import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Music, Play, Pause, Check } from 'lucide-react'
import { musicService } from '../../services/musicService'

export default function MusicSelectionModal({ onSelect, onClose, currentSelected = null }) {
    const [search, setSearch] = useState('')
    const [musicList, setMusicList] = useState([])
    const [loading, setLoading] = useState(false)
    const [playingId, setPlayingId] = useState(null)
    const audioRef = useRef(null)

    useEffect(() => {
        fetchMusic()
    }, [search])

    const fetchMusic = async () => {
        setLoading(true)
        try {
            const data = await musicService.getActiveMusic(1, search)
            setMusicList(data.music || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const togglePlay = (m) => {
        if (playingId === m._id || playingId === m.id) {
            audioRef.current.pause()
            setPlayingId(null)
        } else {
            setPlayingId(m._id || m.id)
            if (audioRef.current) {
                audioRef.current.src = m.audioUrl
                audioRef.current.play()
            }
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-black/10 flex flex-col"
                style={{ maxHeight: '80vh' }}
            >
                <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-zinc-900">Add Music</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-hidden flex flex-col">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search songs or artists..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm text-zinc-900 placeholder:text-zinc-500"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {loading ? (
                            <div className="py-10 text-center text-zinc-400 text-sm">Loading music...</div>
                        ) : musicList.length === 0 ? (
                            <div className="py-10 text-center text-zinc-400 text-sm">No music found</div>
                        ) : (
                            musicList.map((m) => {
                                const isPlaying = playingId === (m._id || m.id);
                                const isSelected = currentSelected?.id === (m._id || m.id);
                                return (
                                    <div 
                                        key={m._id || m.id}
                                        className={`flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer ${isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-zinc-50 border border-transparent'}`}
                                        onClick={() => onSelect({ id: m._id || m.id, title: m.title, artist: m.artist, audioUrl: m.audioUrl, duration: m.duration, thumbnail: m.thumbnail })}
                                    >
                                        <div className="relative group shrink-0" onClick={(e) => { e.stopPropagation(); togglePlay(m); }}>
                                            {m.thumbnail ? (
                                                <img src={m.thumbnail} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                                                    <Music size={20} />
                                                </div>
                                            )}
                                            <div className={`absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 text-white transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate text-zinc-900">{m.title}</p>
                                            <p className="text-xs text-zinc-500 truncate">{m.artist}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-zinc-400 font-mono">
                                                {Math.floor(m.duration / 60)}:{(m.duration % 60).toString().padStart(2, '0')}
                                            </span>
                                            {isSelected && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white shrink-0"><Check size={12} strokeWidth={3} /></div>}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />
            </motion.div>
        </div>
    )
}

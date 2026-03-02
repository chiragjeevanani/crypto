import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2 } from 'lucide-react'
import { useFeedStore } from '../../store/useFeedStore'
import { formatCount } from '../../utils/formatCurrency'

export default function ReelViewerModal({ posts = [], startIndex = null, onClose }) {
    const { toggleLike } = useFeedStore()
    const [index, setIndex] = useState(startIndex)

    useEffect(() => {
        setIndex(startIndex)
    }, [startIndex])

    useEffect(() => {
        if (startIndex === null) return undefined
        const onKey = (event) => {
            if (event.key === 'Escape') onClose?.()
            if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                setIndex((prev) => (prev === null ? 0 : Math.min(posts.length - 1, prev + 1)))
            }
            if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                setIndex((prev) => (prev === null ? 0 : Math.max(0, prev - 1)))
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose, posts.length, startIndex])

    const post = useMemo(() => {
        if (index === null || index < 0 || index >= posts.length) return null
        return posts[index]
    }, [index, posts])

    if (!post) return null

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 rounded-full p-2 text-white bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="h-full w-full flex items-center justify-center px-3 py-4">
                    <div className="relative w-full max-w-[430px] h-full max-h-[92vh] rounded-3xl overflow-hidden bg-black border border-white/15">
                        <img src={post.media.url} alt={post.caption} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                        <div className="absolute right-3 bottom-24 flex flex-col gap-3">
                            <button
                                onClick={() => toggleLike(post.id)}
                                className="w-10 h-10 rounded-full bg-black/35 text-white flex items-center justify-center"
                            >
                                <Heart size={18} fill={post.isLiked ? '#f43f5e' : 'transparent'} />
                            </button>
                            <div className="text-center text-[11px] font-semibold text-white">{formatCount(post.likes)}</div>
                            <button className="w-10 h-10 rounded-full bg-black/35 text-white flex items-center justify-center">
                                <MessageCircle size={18} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-black/35 text-white flex items-center justify-center">
                                <Share2 size={18} />
                            </button>
                        </div>

                        <div className="absolute left-0 right-0 bottom-0 p-4 pr-16 text-white">
                            <p className="text-sm font-semibold">@{post.creator.username}</p>
                            <p className="text-xs mt-1 opacity-90 line-clamp-3">{post.caption}</p>
                        </div>

                        <button
                            onClick={() => setIndex((prev) => Math.max(0, (prev ?? 0) - 1))}
                            disabled={index === 0}
                            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full items-center justify-center bg-black/45 text-white disabled:opacity-30"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setIndex((prev) => Math.min(posts.length - 1, (prev ?? 0) + 1))}
                            disabled={index === posts.length - 1}
                            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full items-center justify-center bg-black/45 text-white disabled:opacity-30"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}


import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react'
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

    const handleCTAClick = (e) => {
        e.stopPropagation()
        if (post?.redirectType === 'whatsapp' && post?.whatsappNumber) {
            const number = post.whatsappNumber.replace(/\D/g, '')
            const text = encodeURIComponent("I am interested in your product")
            window.open(`https://wa.me/${number}?text=${text}`, '_blank')
        } else if (post?.redirectType === 'internal') {
            console.log("Redirect to internal messaging")
        }
    }

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
                    <div className="relative w-full max-w-[430px] h-full max-h-[92vh] rounded-3xl overflow-hidden bg-black border border-white/15 shadow-2xl">
                        {post.media.type === 'video' ? (
                            <video src={post.media.url} style={{ filter: post.filter || 'none' }} className="w-full h-full object-cover" autoPlay loop playsInline muted />
                        ) : (
                            <img src={post.media.url} style={{ filter: post.filter || 'none' }} alt={post.caption} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                        <div className="absolute right-3 bottom-24 flex flex-col gap-3 z-20">
                            <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={() => toggleLike(post.id)}
                                className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md"
                            >
                                <Heart size={20} fill={post.isLiked ? '#f43f5e' : 'transparent'} stroke={post.isLiked ? '#f43f5e' : 'currentColor'} />
                            </motion.button>
                            <div className="text-center text-[11px] font-bold text-white shadow-sm">{formatCount(post.likes)}</div>
                            <button className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md">
                                <MessageCircle size={20} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md">
                                <Share2 size={20} />
                            </button>
                        </div>

                        <div className="absolute left-0 right-0 bottom-0 p-5 pb-8 pr-16 text-white z-20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-bold bg-white/10 px-2 py-0.5 rounded-lg backdrop-blur-md">@{post.creator.username}</span>
                                {post.isBusiness && (
                                    <span className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-blue-500/30 backdrop-blur-md">
                                        <TrendingUp size={10} />
                                        SPONSORED
                                    </span>
                                )}
                            </div>
                            <p className="text-xs opacity-90 line-clamp-2 leading-relaxed">{post.caption}</p>
                        </div>

                        {/* Business CTA Bar - Screenshot Style */}
                        {post.isBusiness && post.ctaType && post.ctaType !== 'none' && (
                            <div 
                                onClick={handleCTAClick}
                                className="absolute bottom-24 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 cursor-pointer transition-all active:brightness-90 hover:brightness-105"
                                style={{ 
                                    background: '#e11d48',
                                    color: '#fff',
                                }}
                            >
                                <span className="font-bold text-[13px] tracking-wide">{post.ctaType}</span>
                                <ChevronRight size={18} strokeWidth={3} />
                            </div>
                        )}

                        <button
                            onClick={() => setIndex((prev) => Math.max(0, (prev ?? 0) - 1))}
                            disabled={index === 0}
                            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full items-center justify-center bg-black/45 text-white disabled:opacity-30 z-20"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setIndex((prev) => Math.min(posts.length - 1, (prev ?? 0) + 1))}
                            disabled={index === posts.length - 1}
                            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full items-center justify-center bg-black/45 text-white disabled:opacity-30 z-20"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}


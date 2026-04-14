import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, TrendingUp, MoreHorizontal, AlertCircle, ShieldAlert, Trash2, Check } from 'lucide-react'
import { useFeedStore } from '../../store/useFeedStore'
import { useUserStore, getStoredToken } from '../../store/useUserStore'
import { formatCount } from '../../utils/formatCurrency'
import { postService } from '../../services/postService'
import { optimizeCloudinaryUrl } from '../../../../utils/mediaOptimization'

export default function ReelViewerModal({ posts = [], startIndex = null, onClose }) {
    const navigate = useNavigate()
    const { profile } = useUserStore()
    const { toggleLike, deletePost } = useFeedStore()
    const [index, setIndex] = useState(startIndex)
    
    const [isReportMenuOpen, setIsReportMenuOpen] = useState(false)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const [reportReason, setReportReason] = useState('')
    const [reportDescription, setReportDescription] = useState('')
    const [isReporting, setIsReporting] = useState(false)

    const handleReport = async () => {
        if (!reportReason || !post) return
        setIsReporting(true)
        try {
            await postService.reportPost(post.id, reportReason, reportDescription)
            setIsReportModalOpen(false)
            setIsReportMenuOpen(false)
            setReportReason('')
            setReportDescription('')
        } catch (error) {
            console.error('Report failed:', error)
        } finally {
            setIsReporting(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this reel?')) return
        try {
            await deletePost(post.id)
            if (posts.length <= 1) onClose()
            else setIndex(prev => Math.min(posts.length - 2, prev)) // Move to prev or stay at last
        } catch (error) {
            alert('Failed to delete reel')
        }
    }

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
            navigate('/messaging', { 
                state: { 
                    openChat: post.creator,
                    initialMessage: `Hi ${post.creator?.username}, I saw your reel "${post.caption?.slice(0, 30) || 'advertisement'}..." and I'm interested!`,
                    sharedPost: {
                        id: post.id,
                        thumbnail: post.media?.url,
                        caption: post.caption,
                        type: 'reel'
                    }
                } 
            })
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
                            <video 
                                src={post.media.url} 
                                style={{ filter: post.filter || 'none' }} 
                                className="w-full h-full object-cover" 
                                autoPlay 
                                loop 
                                playsInline 
                                muted 
                                preload="auto"
                                poster={optimizeCloudinaryUrl(post.media?.thumbnail || post.media?.poster || post.media?.url?.replace(/\.[^/.]+$/, ".jpg"), { width: 480, quality: '50' })}
                            />
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
                            
                            <div className="relative">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsReportMenuOpen(!isReportMenuOpen)
                                    }}
                                    className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                                <AnimatePresence>
                                    {isReportMenuOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95, x: -20 }}
                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, x: -20 }}
                                            className="absolute right-full mr-2 bottom-0 w-40 rounded-xl shadow-xl z-[40] border overflow-hidden"
                                            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                                        >
                                            {post.creator?.id && profile?.id && String(post.creator.id) === String(profile.id) ? (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setIsReportMenuOpen(false)
                                                        handleDelete()
                                                    }}
                                                    className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                                >
                                                    <Trash2 size={14} />
                                                    Delete Reel
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setIsReportMenuOpen(false)
                                                        setIsReportModalOpen(true)
                                                    }}
                                                    className="w-full px-4 py-3 text-left text-sm font-semibold hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2"
                                                >
                                                    <AlertCircle size={14} />
                                                    Report Reel
                                                </button>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="absolute left-0 right-0 bottom-0 p-5 pb-8 pr-16 text-white z-20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="flex items-center gap-1 text-sm font-bold bg-white/10 px-2 py-0.5 rounded-lg backdrop-blur-md">
                                    @{post.creator.username}
                                    {post.creator?.isPremium && (
                                        <div className="w-3 h-3 rounded-full bg-orange-500 flex items-center justify-center p-0.5">
                                            <Check size={8} className="text-white" strokeWidth={5} />
                                        </div>
                                    )}
                                </span>
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

                <AnimatePresence>
                    {isReportModalOpen && (
                        <motion.div
                            className="fixed inset-0 z-[130] flex items-center justify-center px-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReportModalOpen(false)} />
                            <motion.div
                                className="relative w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-6"
                                style={{ background: 'var(--color-surface)' }}
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="text-lg font-black" style={{ color: 'var(--color-text)' }}>Report Reel</h3>
                                    <button onClick={() => setIsReportModalOpen(false)} className="p-1 rounded-full hover:bg-zinc-800/10">
                                        <X size={20} />
                                    </button>
                                </div>
                                <p className="text-[12px] mb-6 opacity-60" style={{ color: 'var(--color-text)' }}>Why are you reporting this content?</p>
                                
                                <div className="space-y-2.5 mb-6 max-h-[40vh] overflow-y-auto pr-1">
                                    {['Spam', 'Harassment', 'Inappropriate', 'Illegal', 'Intellectual Property', 'Other'].map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => setReportReason(option)}
                                            className={`w-full px-4 py-3 rounded-2xl text-sm font-bold text-left transition-all ${reportReason === option ? 'bg-[var(--color-primary)] text-white shadow-lg' : 'bg-[var(--color-surface2)] text-[var(--color-text)] hover:brightness-95'}`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>

                                {reportReason === 'Other' && (
                                    <div className="mb-6">
                                        <textarea
                                            className="w-full h-24 p-4 rounded-2xl text-sm outline-none resize-none"
                                            placeholder="Please describe the issue..."
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                            value={reportDescription}
                                            onChange={(e) => setReportDescription(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsReportModalOpen(false)}
                                        className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-colors"
                                        style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}
                                        disabled={isReporting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReport}
                                        className="flex-1 py-3.5 rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50"
                                        style={{ background: 'var(--color-primary)', color: '#fff' }}
                                        disabled={!reportReason || isReporting}
                                    >
                                        {isReporting ? 'Submitting...' : 'Submit Report'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    )
}


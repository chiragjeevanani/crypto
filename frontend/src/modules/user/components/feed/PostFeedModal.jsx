import { memo, useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Share2, TrendingUp, Bookmark, Volume2, VolumeX, Sparkles, Music, Eye, Check, MoreHorizontal, AlertCircle, X, Trash2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import PostCard from './PostCard'
import CampaignReelCard from './CampaignReelCard'
import { useFeedStore } from '../../store/useFeedStore'
import { useWalletStore } from '../../store/useWalletStore'
import { useUserStore } from '../../store/useUserStore'
import { triggerCoinRain } from '../shared/CoinRain'
import { playGiftSound } from '../../utils/giftSounds'
import GiftBar from './GiftBar'
import PostSplat from './PostSplat'
import { formatCurrency, formatCount, timeAgo } from '../../utils/formatCurrency'
import { optimizeCloudinaryUrl } from '../../../../utils/mediaOptimization'
import Avatar from '../shared/Avatar'
import { postService } from '../../services/postService'

import ReelFullSkeleton from './ReelFullSkeleton'

const ReelPostInner = ({ post, active, shouldPreload, onClose }) => {
    if (!post?.creator) return <ReelFullSkeleton />

    const {
        toggleLike, sendGift, splats, clearSplat, earningsByPostId, savedPostIds, toggleSavePost,
        voteCampaignSubmission, deletePost, toggleFollow, loadComments, addComment, commentsByPostId, commentsLoading
    } = useFeedStore()
    const { addGiftEarning, spendGiftFromSelectedWallet, performGift } = useWalletStore()
    const { profile } = useUserStore()
    const navigate = useNavigate()
    const creatorInitial = (post.creator?.username || 'U').charAt(0)
    const splat = splats[post.id]
    const earnings = earningsByPostId?.[post.id] ?? post.earnings ?? 0
    const isSelfPost = profile?._id && post.creator?._id && String(profile._id) === String(post.creator._id)

    const [showComments, setShowComments] = useState(false)
    const [commentDraft, setCommentDraft] = useState('')
    const postComments = commentsByPostId[post.id] ?? []

    useEffect(() => {
        if (showComments && post.id) loadComments(post.id)
    }, [showComments, post.id, loadComments])

    const handleComment = (e) => {
        if (e) e.stopPropagation()
        setShowComments(true)
    }

    const handleAddComment = async () => {
        const text = commentDraft.trim()
        if (!text) return
        try {
            await addComment(post.id, text)
            setCommentDraft('')
        } catch { /* ignore */ }
    }

    const handleLike = async (e) => {
        if (e) e.stopPropagation()
        const id = post.id || post._id
        console.log('[Reel] handleLike clicked for ID:', id)
        if (!id) return

        try {
            if (post.category === 'Campaign' && post.campaign && post.campaignSubmission) {
                const cId = post.campaign.id || post.campaign._id || post.campaign;
                const sId = post.campaignSubmission.id || post.campaignSubmission._id || post.campaignSubmission;
                await voteCampaignSubmission(cId, sId, id)
            } else {
                await toggleLike(id)
            }
        } catch (err) {
            console.error('[Reel] Like error:', err)
        }
    }
    const handleGift = async (gift) => {
        const receiverId = post.creator?._id || post.creator?.id
        const postId = post._id || post.id

        const result = await performGift({
            gift,
            receiverId,
            postId,
            reelId: postId
        })
        if (!result.ok) {
            if (result.error === 'insufficient_balance') {
                navigate('/wallet')
            }
            return
        }
        sendGift(post.id, gift)
        const creatorIdStr = String(post.creator?._id || post.creator?.id || '')
        const profileIdStr = String(profile?._id || profile?.id || '')
        if (creatorIdStr === profileIdStr) addGiftEarning(gift.price)
        if (gift.price >= 5) triggerCoinRain()
    }

    const [isMuted, setIsMuted] = useState(false)
    const isSaved = savedPostIds.has(String(post.id))
    const [showMuteIndicator, setShowMuteIndicator] = useState(false)

    // Reporting state
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
            if (onClose) onClose() // Close modal after delete
        } catch (error) {
            alert('Failed to delete reel')
        }
    }

    const videoRef = useRef(null)
    const audioRef = useRef(null)

    const toggleMute = (e) => {
        if (e) e.stopPropagation()
        const nextMuted = !isMuted
        setIsMuted(nextMuted)

        if (audioRef.current) {
            audioRef.current.muted = nextMuted
            if (!nextMuted) audioRef.current.play().catch(() => { })
        }
        if (videoRef.current) {
            videoRef.current.muted = nextMuted
            if (!nextMuted) videoRef.current.play().catch(() => { })
        }

        setShowMuteIndicator(true)
        setTimeout(() => setShowMuteIndicator(false), 800)
    }

    useEffect(() => {
        if (active) {
            const recordView = useFeedStore.getState().recordView
            if (recordView) recordView(post.id)
        }
    }, [active, post.id])

    useEffect(() => {
        let isCurrent = true
        const video = videoRef.current
        const audio = audioRef.current

        if (active) {
            const playMedia = async () => {
                try {
                    if (video) {
                        video.muted = isMuted
                        // Ensure video is ready to play
                        if (video.readyState >= 2) {
                            if (isCurrent) await video.play()
                        } else {
                            video.oncanplay = async () => {
                                if (isCurrent && active) await video.play()
                            }
                        }
                    }
                    if (audio) {
                        audio.muted = isMuted
                        if (audio.readyState >= 2) {
                            if (isCurrent) await audio.play()
                        } else {
                            audio.oncanplay = async () => {
                                if (isCurrent && active) await audio.play()
                            }
                        }
                    }
                } catch (err) {
                    if (err.name === 'NotAllowedError' && !isMuted && isCurrent) {
                        setIsMuted(true)
                    }
                }
            }
            playMedia()
        } else {
            if (video) {
                video.pause()
                video.currentTime = 0
                video.oncanplay = null
            }
            if (audio) {
                audio.pause()
                audio.currentTime = 0
                audio.oncanplay = null
            }
        }

        return () => {
            isCurrent = false
            if (video) {
                video.pause()
                video.oncanplay = null
            }
            if (audio) {
                audio.pause()
                audio.oncanplay = null
            }
        }
    }, [active, post.id, isMuted])





    return (
        <div className="relative flex flex-col h-full bg-black items-center justify-center">
            {/* Mobile: full height/width. Desktop: 9:16 with max widths. */}
            <div className="relative w-full h-full mx-auto overflow-hidden bg-black md:h-auto md:aspect-[9/16] md:max-w-[520px] lg:max-w-[560px] md:max-h-[calc(100vh-56px)]">
                {post.media?.type === 'video' ? (
                    <video
                        key={`vid-${post.id}`}
                        ref={videoRef}
                        src={optimizeCloudinaryUrl(post.media?.url, { isVideo: true, width: 720, quality: '50' })}
                        className="w-full h-full object-cover cursor-pointer"
                        style={{ filter: post.filter || 'none' }}
                        loop
                        muted={isMuted}
                        playsInline
                        preload={active || shouldPreload ? "auto" : "metadata"}
                        poster={optimizeCloudinaryUrl(post.media?.thumbnail || post.media?.poster || post.media?.url?.replace(/\.[^/.]+$/, ".jpg"), { width: 480, quality: '50' })}
                        crossOrigin="anonymous"
                        onClick={toggleMute}
                    />
                ) : (
                    <img
                        key={`img-${post.id}`}
                        src={optimizeCloudinaryUrl(post.media?.url, { width: 1080, quality: '80' })}
                        className="w-full h-full object-cover cursor-pointer"
                        style={{ filter: post.filter || 'none' }}
                        alt="Reel content"
                        onClick={toggleMute}
                    />
                )}

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

                <AnimatePresence>
                    {splat && (
                        <PostSplat
                            key={splat.key}
                            type={splat.type}
                            onComplete={() => clearSplat(post.id)}
                        />
                    )}
                </AnimatePresence>

                {/* Right-side actions (Instagram-style) */}
                <div
                    className="absolute right-2 flex flex-col items-center gap-4 text-white z-40"
                    style={{ bottom: 'calc(96px + var(--reels-bottom-offset, 0px))' }}
                >
                    <button
                        type="button"
                        onClick={handleLike}
                        className="flex flex-col items-center gap-1 cursor-pointer"
                    >
                        <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center relative overflow-hidden group">
                            {post.category === 'Campaign' ? (
                                <>
                                    <Sparkles
                                        size={24}
                                        className={`transition-all duration-300 ${post.isLiked ? 'text-primary scale-110' : 'text-white'}`}
                                    />
                                    {post.isLiked && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute inset-0 bg-primary/20 backdrop-blur-[2px]"
                                        />
                                    )}
                                </>
                            ) : (
                                <Heart size={22} fill={post.isLiked ? 'currentColor' : 'none'} style={{ color: post.isLiked ? '#ff3b30' : 'white' }} />
                            )}
                        </div>
                        <span className={`text-[11px] font-black uppercase tracking-tighter ${post.isLiked && post.category === 'Campaign' ? 'text-primary' : 'text-white'}`}>
                            {post.category === 'Campaign' ? (post.isLiked ? 'VOTED' : 'VOTE') : (post.likes ?? 0)}
                        </span>
                    </button>
                    {isSelfPost && (
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
                                <Eye size={22} className="text-white" />
                            </div>
                            <span className="text-[11px] font-semibold">
                                {formatCount(post.views ?? 0)}
                            </span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleComment}
                        className="flex flex-col items-center gap-1 cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
                            <MessageCircle size={22} />
                        </div>
                        <span className="text-[11px] font-semibold">
                            {post.comments ?? 0}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleSavePost(post.id)
                        }}
                        className="flex flex-col items-center gap-1 cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
                            <Bookmark size={22} fill={isSaved ? 'white' : 'none'} />
                        </div>
                        <span className="text-[11px] font-semibold">
                            {isSaved ? 'Saved' : 'Save'}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/messaging')}
                        className="flex flex-col items-center gap-1 cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
                            <Share2 size={22} />
                        </div>
                        <span className="text-[11px] font-semibold">
                            {post.shares ?? 0}
                        </span>
                    </button>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsReportMenuOpen(!isReportMenuOpen)
                            }}
                            className="flex flex-col items-center gap-1 cursor-pointer"
                        >
                            <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
                                <MoreHorizontal size={22} />
                            </div>
                            <span className="text-[11px] font-semibold">More</span>
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
                                    {isSelfPost ? (
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
                                className="relative w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                                style={{ background: 'var(--color-surface)' }}
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="text-lg font-black" style={{ color: 'var(--color-text)' }}>Report Reel</h3>
                                    <button onClick={() => setIsReportModalOpen(false)} className="p-1 rounded-full hover:bg-zinc-800/10 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <p className="text-[12px] mb-6 opacity-60 font-medium" style={{ color: 'var(--color-text)' }}>Help us understand what's wrong.</p>

                                <div className="space-y-2 mb-6 max-h-[40vh] overflow-y-auto pr-1">
                                    {['Spam', 'Harassment', 'Inappropriate', 'Illegal', 'Intellectual Property', 'Other'].map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => setReportReason(option)}
                                            className={`w-full px-4 py-3.5 rounded-2xl text-sm font-bold text-left transition-all ${reportReason === option ? 'bg-[var(--color-primary)] text-white shadow-lg' : 'bg-[var(--color-surface2)] text-[var(--color-text)] hover:brightness-95'}`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>

                                {reportReason === 'Other' && (
                                    <div className="mb-6">
                                        <textarea
                                            className="w-full h-24 p-4 rounded-2xl text-sm outline-none resize-none font-medium"
                                            placeholder="Please describe the issue..."
                                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                            value={reportDescription}
                                            onChange={(e) => setReportDescription(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setIsReportModalOpen(false)}
                                        className="flex-1 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
                                        style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}
                                        disabled={isReporting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReport}
                                        className="flex-1 py-4 rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50"
                                        style={{ background: 'var(--color-primary)', color: '#fff' }}
                                        disabled={!reportReason || isReporting}
                                    >
                                        {isReporting ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Reporting</span>
                                            </div>
                                        ) : 'Submit'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom creator bar + gifts (gifts horizontal after profile circle) */}
                <div
                    className="absolute left-3 right-3 flex items-center justify-between gap-3"
                    style={{ bottom: 'calc(12px + var(--reels-bottom-offset, 0px))' }}
                >
                    {/* Profile circle + username + caption */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center">
                            <Avatar src={post.creator?.avatar} alt={post.creator?.username} size="w-full h-full" isPremium={post.creator?.isPremium} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-semibold text-white">
                                    {post.creator?.username || 'User'}
                                </span>
                                {post.creator?.isPremium && (
                                    <div className="w-3 h-3 rounded-full bg-orange-500 flex items-center justify-center p-0.5 shadow-sm">
                                        <Check size={9} className="text-white" strokeWidth={5} />
                                    </div>
                                )}
                            </div>
                            <span className="text-[11px] text-white/70 truncate max-w-[140px]">
                                {post.caption || ''}
                            </span>
                            {post.campaign && (
                                <Link
                                    to={`/campaigns/${post.campaign.id || post.campaign._id}`}
                                    className="block mt-2 p-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md"
                                >
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <Sparkles size={11} className="text-zinc-400" />
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Related Campaign</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-bold text-white truncate max-w-[120px]">{post.campaign.title}</span>
                                        <span className="text-[9px] font-bold bg-white text-black px-2 py-0.5 rounded-full">JOIN</span>
                                    </div>
                                </Link>
                            )}
                            <div className="mt-2 max-w-[240px]">
                                <GiftBar postId={post.id} onGift={handleGift} compact showCounts={false} />
                            </div>
                        </div>
                    </div>
                    <div
                        className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                        style={{ background: 'rgba(245,158,11,0.18)', color: 'var(--color-primary)' }}
                    >
                        <TrendingUp size={12} />
                        {formatCurrency(earnings, profile?.currencySymbol || '₹')}
                    </div>

                    {post.musicData && (
                        <div className="absolute left-0 -bottom-8 flex items-center gap-2 overflow-hidden w-fit max-w-[140px]">
                            <Music size={10} className="text-white animate-spin-slow" />
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="whitespace-nowrap animate-scroll-text inline-block">
                                    <span className="text-[9px] font-bold text-white mr-4">
                                        {post.musicData.title} · {post.musicData.artist}
                                    </span>
                                    <span className="text-[9px] font-bold text-white mr-4">
                                        {post.musicData.title} · {post.musicData.artist}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>                {typeof document !== 'undefined' && createPortal(
                    <AnimatePresence>
                        {showComments && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowComments(false)}
                                    className="fixed inset-0 bg-black/80 z-[200]"
                                />
                                <motion.div
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="fixed bottom-0 left-0 right-0 h-[75%] md:h-[70%] bg-white text-zinc-900 rounded-t-[32px] z-[210] overflow-hidden flex flex-col md:max-w-[520px] lg:max-w-[560px] mx-auto shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-4 flex items-center justify-between border-b border-zinc-100 sticky top-0 bg-white z-10 px-6">
                                        <h4 className="font-bold flex items-center gap-2 text-base text-zinc-900">
                                            Comments
                                            <span className="text-sm font-normal opacity-40">({post.comments || 0})</span>
                                        </h4>
                                        <button
                                            onClick={() => setShowComments(false)}
                                            className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 bg-zinc-50/50">
                                        {commentsLoading[post.id] ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-40">
                                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                <p className="text-sm">Loading comments...</p>
                                            </div>
                                        ) : postComments.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-24 opacity-20">
                                                <MessageCircle size={56} strokeWidth={1.5} className="mb-4" />
                                                <p className="text-base font-medium">No comments yet</p>
                                                <p className="text-xs mt-1">Start the conversation!</p>
                                            </div>
                                        ) : (
                                            postComments.map((comment) => (
                                                <div key={comment.id} className="flex gap-3.5">
                                                    <div className="w-9 h-9 rounded-full bg-white flex-shrink-0 flex items-center justify-center overflow-hidden border border-zinc-200 shadow-sm">
                                                        {comment.author?.avatar ? (
                                                            <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-sm font-bold text-zinc-300">{(comment.author?.name || 'U')[0]}</span>
                                                        )
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-sm font-extrabold text-zinc-900 truncate max-w-[120px]">{comment.author?.handle || comment.author?.name || 'User'}</span>
                                                            <span className="text-[10px] text-zinc-400 shrink-0">{timeAgo(comment.createdAt)}</span>
                                                        </div>
                                                        <p className="text-[13px] leading-relaxed text-zinc-700 break-words font-medium">{comment.text}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="p-4 border-t border-zinc-100 bg-white safe-area-bottom px-6">
                                        <div className="flex items-center gap-3 bg-zinc-100 rounded-2xl px-4 py-2 border border-zinc-200 transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white focus-within:shadow-sm">
                                            <input
                                                type="text"
                                                value={commentDraft}
                                                onChange={(e) => setCommentDraft(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                                                placeholder="Add a comment..."
                                                className="flex-1 bg-transparent border-none outline-none text-[13px] py-1 text-zinc-900 placeholder:text-zinc-400"
                                            />
                                            <button
                                                onClick={handleAddComment}
                                                disabled={!commentDraft.trim()}
                                                className="text-primary font-bold text-sm disabled:opacity-30 px-2 transition-all active:scale-95 disabled:scale-100"
                                            >
                                                Post
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>,
                    document.body
                )}


                {post.musicData && (
                    <audio
                        ref={audioRef}
                        src={post.musicData.audioUrl}
                        type="audio/mpeg"
                        loop
                        muted={isMuted}
                        preload="none"
                        onPlay={(e) => {
                            if (post.musicStartTime) e.target.currentTime = post.musicStartTime
                        }}
                    />
                )}
            </div>
        </div>
    )
}

const ReelPost = memo(ReelPostInner)

export default function PostFeedModal({ posts = [], startIndex = null, onClose, forceReels = false }) {
    const containerRef = useRef(null)
    const postRefs = useRef({})
    const [activeReelIndex, setActiveReelIndex] = useState(null)
    const itemHeightRef = useRef(0)
    const loopedPosts = useMemo(() => (posts.length > 1 ? [...posts, ...posts, ...posts] : posts), [posts])

    const isOpen = startIndex !== null && startIndex >= 0
    const isReelsMode = useMemo(() => {
        if (forceReels) return true
        if (!posts.length) return false
        const hasTyped = posts.every((p) => p.postType === 'brand' || p.postType === 'nft' || p.postType === 'regular')
        if (hasTyped) {
            // If it's a mix, check if they are mostly videos
            const videoCount = posts.filter(p => p.media?.type === 'video').length
            return videoCount / posts.length > 0.5
        }
        return posts.every((p) => p.media?.type === 'video')
    }, [posts, forceReels])
    const safeIndex = useMemo(() => {
        if (!isOpen) return 0
        return Math.max(0, Math.min(posts.length - 1, startIndex))
    }, [isOpen, posts.length, startIndex])

    useEffect(() => {
        if (!isOpen) return undefined
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (event) => {
            if (event.key === 'Escape') onClose?.()
        }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = prev
            window.removeEventListener('keydown', onKey)
        }
    }, [isOpen, onClose])

    useEffect(() => {
        if (!isOpen) return
        const loopIndex = posts.length > 1 ? posts.length + safeIndex : safeIndex
        const node = postRefs.current[loopIndex]
        if (node && containerRef.current) {
            node.scrollIntoView({ behavior: 'smooth', block: 'start' })
            setActiveReelIndex(loopIndex)
        }
    }, [isOpen, loopedPosts, safeIndex, posts.length])

    useEffect(() => {
        if (!isOpen) return
        const container = containerRef.current
        if (!container) return
        const firstItem = container.querySelector('.reels-item')
        if (firstItem) {
            itemHeightRef.current = firstItem.getBoundingClientRect().height || itemHeightRef.current
        }
    }, [isOpen, loopedPosts])

    useEffect(() => {
        if (!isOpen || !isReelsMode) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const ratio = entry.intersectionRatio
                    if (entry.isIntersecting && ratio >= 0.8) {
                        const index = parseInt(entry.target.getAttribute('data-index'))
                        if (!isNaN(index)) {
                            setActiveReelIndex(index)
                        }
                    }
                })
            },
            {
                root: containerRef.current,
                threshold: [0.8],
            }
        )

        const container = containerRef.current
        if (container) {
            const items = container.querySelectorAll('.reels-item')
            items.forEach((item) => observer.observe(item))
        }

        return () => observer.disconnect()
    }, [isOpen, isReelsMode, loopedPosts])

    useEffect(() => {
        if (!isOpen || posts.length <= 1) return
        const container = containerRef.current
        if (!container) return
        let lock = false
        const onScroll = () => {
            if (lock) return
            const itemHeight = itemHeightRef.current
            if (!itemHeight) return
            const loopSize = posts.length * itemHeight
            const start = loopSize
            const end = loopSize * 2
            const y = container.scrollTop
            if (y < start) {
                lock = true
                container.scrollTo({ top: y + loopSize, behavior: 'auto' })
                setTimeout(() => { lock = false }, 20)
            } else if (y >= end) {
                lock = true
                container.scrollTo({ top: y - loopSize, behavior: 'auto' })
                setTimeout(() => { lock = false }, 20)
            }
        }
        container.addEventListener('scroll', onScroll, { passive: true })
        return () => container.removeEventListener('scroll', onScroll)
    }, [isOpen, posts.length])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[65] flex flex-col md:left-[84px] lg:left-[248px] lg:right-[300px] xl:right-[332px]"
                style={{
                    background: isReelsMode ? '#000' : 'var(--color-bg)',
                    '--reels-header-height': '64px',
                    '--reels-bottom-offset': 'calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 24px)',
                    '--reels-viewport-height': isReelsMode ? '100svh' : 'auto'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div
                    className={`${isReelsMode ? 'absolute top-0 left-0 right-0' : 'sticky top-0'} z-20 flex items-center gap-3 px-4 py-4 shrink-0 ${isReelsMode ? 'pointer-events-none' : ''}`}
                    style={{
                        background: isReelsMode ? 'transparent' : 'var(--color-bg)',
                        borderBottom: isReelsMode ? 'none' : '1px solid var(--color-border)',
                        paddingTop: isReelsMode ? 'calc(env(safe-area-inset-top, 0px) + 16px)' : 'calc(env(safe-area-inset-top, 0px) + 12px)'
                    }}
                >
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center cursor-pointer pointer-events-auto"
                        style={{ color: isReelsMode ? '#fff' : 'var(--color-text)' }}
                    >
                        <ArrowLeft size={isReelsMode ? 28 : 20} strokeWidth={isReelsMode ? 2.5 : 2} />
                    </button>
                    {!isReelsMode && (
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            Posts
                        </p>
                    )}
                </div>

                <div
                    ref={containerRef}
                    className="flex-1 overflow-y-auto overflow-x-hidden px-0 py-0 md:px-0 hide-scrollbar snap-y snap-mandatory"
                    style={{
                        paddingBottom: isReelsMode ? 0 : 'var(--reels-bottom-offset)',
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    <div className="mx-auto w-full md:max-w-[460px] lg:max-w-[520px]">
                        {loopedPosts.map((post, index) => (
                            <div
                                key={`${post.id}-${index}`}
                                ref={(node) => {
                                    if (node) postRefs.current[index] = node
                                }}
                                className="snap-start snap-always shrink-0 w-full reels-item"
                                data-index={index}
                            >
                                {isReelsMode
                                    ? post?.type === 'campaign'
                                        ? <CampaignReelCard campaign={post} active={activeReelIndex === index} />
                                        : <ReelPost post={post} active={activeReelIndex === index} shouldPreload={activeReelIndex !== null && Math.abs(index - activeReelIndex) <= 1} onClose={onClose} />
                                    : post && <PostCard post={post} onDeleteSuccess={onClose} />}
                            </div>
                        ))}
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    )
}

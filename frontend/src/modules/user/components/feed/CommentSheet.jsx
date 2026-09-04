import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Heart, Smile } from 'lucide-react'
import { timeAgo } from '../../utils/formatCurrency'
import BottomModal from '../shared/BottomModal'
import Avatar from '../shared/Avatar'
import { getStoredToken } from '../../store/useUserStore'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function CommentSheet({ postId, onClose }) {
    const [newComment, setNewComment] = useState('')
    const inputRef = useRef(null)
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!postId) return
        let mounted = true
        setLoading(true)
        fetch(`${API_BASE}/user/posts/${postId}/comments`, {
            headers: { Authorization: `Bearer ${getStoredToken()}` }
        })
            .then(r => r.json())
            .then(data => {
                if (mounted && data.comments) {
                    setComments(data.comments.map(c => ({
                        id: c.id,
                        postId: c.postId,
                        user: {
                            id: c.author?.id || '',
                            username: c.author?.name || c.author?.username || 'User',
                            handle: c.author?.handle || '@user'
                        },
                        text: c.text,
                        createdAt: c.createdAt,
                        likes: 0,
                        isLiked: false
                    })))
                }
            })
            .catch(() => {})
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }, [postId])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newComment.trim()) return

        const text = newComment.trim()
        setNewComment('')

        try {
            const res = await fetch(`${API_BASE}/user/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getStoredToken()}`
                },
                body: JSON.stringify({ text })
            })
            const data = await res.json()
            if (data.comment) {
                const c = data.comment
                setComments(prev => [{
                    id: c.id,
                    postId: c.postId,
                    user: { id: c.author?.id || '', username: c.author?.name || 'You', handle: c.author?.handle || '@me' },
                    text: c.text,
                    createdAt: c.createdAt,
                    likes: 0,
                    isLiked: false
                }, ...prev])
            }
        } catch {}
    }

    const toggleLike = (id) => {
        setComments(prev => prev.map(c => {
            if (c.id === id) {
                return {
                    ...c,
                    isLiked: !c.isLiked,
                    likes: c.isLiked ? c.likes - 1 : c.likes + 1
                }
            }
            return c
        }))
    }

    const handleReply = (username) => {
        setNewComment(`@${username} `)
        inputRef.current?.focus()
    }

    return (
        <BottomModal
            isOpen={true}
            onClose={onClose}
            title="Comments"
            maxHeight="60vh"
        >
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-5 py-1 space-y-4 hide-scrollbar">
                {loading ? (
                    <div className="flex justify-center py-8 opacity-50">
                        <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" style={{ color: 'var(--color-muted)' }} />
                    </div>
                ) : (
                <AnimatePresence initial={false}>
                    {comments.length > 0 ? (
                        comments.map((comment) => (
                            <motion.div
                                key={comment.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-2.5"
                            >
                                <Avatar src={comment.user?.avatar} alt={comment.user?.username} size="xs" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <p className="text-[12px] font-bold" style={{ color: 'var(--color-text)' }}>
                                            {comment.user.username}
                                        </p>
                                        <span className="text-[9px]" style={{ color: 'var(--color-muted)' }}>
                                            {timeAgo(comment.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: 'var(--color-sub)' }}>
                                        {comment.text}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <button
                                            onClick={() => toggleLike(comment.id)}
                                            className="flex items-center gap-1 text-[9px] font-bold cursor-pointer transition-colors"
                                            style={{ color: comment.isLiked ? 'var(--color-danger)' : 'var(--color-muted)' }}
                                        >
                                            <Heart size={10} fill={comment.isLiked ? 'currentColor' : 'transparent'} />
                                            {comment.likes > 0 ? comment.likes : 'Like'}
                                        </button>
                                        <button
                                            onClick={() => handleReply(comment.user.username)}
                                            className="text-[9px] font-bold cursor-pointer hover:text-[var(--color-primary)] transition-colors"
                                            style={{ color: 'var(--color-muted)' }}
                                        >
                                            Reply
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
                            <Smile size={28} style={{ color: 'var(--color-muted)' }} />
                            <p className="text-xs font-semibold mt-2" style={{ color: 'var(--color-muted)' }}>No comments yet</p>
                        </div>
                    )}
                </AnimatePresence>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 pb-6 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
                <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2 bg-[var(--color-surface2)] rounded-xl px-3 py-1"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 bg-transparent text-[12px] py-1.5 px-0.5 outline-none font-medium"
                        style={{ color: 'var(--color-text)' }}
                    />
                    <motion.button
                        type="submit"
                        whileTap={{ scale: 0.9 }}
                        disabled={!newComment.trim()}
                        className="p-1.5 rounded-lg transition-all disabled:opacity-30 cursor-pointer"
                        style={{ color: newComment.trim() ? 'var(--color-primary)' : 'var(--color-muted)' }}
                    >
                        <Send size={16} />
                    </motion.button>
                </form>
            </div>
        </BottomModal>
    )
}

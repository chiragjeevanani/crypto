import { useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import PostCard from './PostCard'

export default function PostFeedModal({ posts = [], startIndex = null, onClose }) {
    const containerRef = useRef(null)
    const postRefs = useRef({})

    const isOpen = startIndex !== null && startIndex >= 0
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
        const targetId = posts[safeIndex]?.id
        if (!targetId) return
        const node = postRefs.current[targetId]
        if (node && containerRef.current) {
            node.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [isOpen, posts, safeIndex])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[80]"
                style={{ background: 'var(--color-bg)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div
                    className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
                    style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
                >
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Posts
                    </p>
                </div>

                <div
                    ref={containerRef}
                    className="h-[calc(100vh-62px)] overflow-y-auto px-3 py-4 md:px-6"
                >
                    <div className="mx-auto w-full max-w-[520px]">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                ref={(node) => {
                                    if (node) postRefs.current[post.id] = node
                                }}
                            >
                                <PostCard post={post} />
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}

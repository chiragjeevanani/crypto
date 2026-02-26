import { useFeedStore } from '../store/useFeedStore'
import PostCard from '../components/feed/PostCard'

export default function HomePage() {
    const { posts } = useFeedStore()

    return (
        <div>
            {/* Header */}
            <div
                className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
                style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
            >
                <span className="text-xl font-extrabold" style={{ color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
                    SocialEarn
                </span>
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}
                    >
                        🔔
                    </div>
                </div>
            </div>

            {/* Feed */}
            <div>
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>

            {/* Bottom padding */}
            <div style={{ height: 16 }} />
        </div>
    )
}

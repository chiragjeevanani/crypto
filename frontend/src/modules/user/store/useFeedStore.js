import { create } from 'zustand'
import { mockPosts } from '../data/mockPosts'

export const useFeedStore = create((set, get) => ({
    posts: mockPosts,
    giftAnimations: {}, // postId -> { emoji, key }
    splats: {}, // postId -> { type, key }
    roseTrigger: 0,
    notifications: [],
    unreadNotifications: 0,

    toggleLike: (postId) => set((state) => ({
        posts: state.posts.map((p) =>
            p.id === postId
                ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
                : p
        ),
    })),

    sendGift: (postId, gift) => {
        const { id, price, emoji } = gift
        const target = get().posts.find((p) => p.id === postId)
        if (target && target.allowGifts === false) return

        const extraNotifications = []
        if (price >= 10) {
            extraNotifications.push({
                id: `note_${Date.now()}`,
                type: 'premium_gift',
                title: `Premium gift broadcast: ₹${price} ${gift.name}`,
                subtitle: `${target?.creator?.username || 'Creator'} just received a premium gift. Join the post now.`,
                createdAt: new Date().toISOString(),
            })
        }
        if (id === 'heart') {
            extraNotifications.push({
                id: `note_followers_${Date.now()}`,
                type: 'follower_broadcast',
                title: `Golden Heart sent to ${target?.creator?.username || 'creator'}`,
                subtitle: 'Broadcast sent to 100 followers to boost engagement.',
                createdAt: new Date().toISOString(),
            })
        }

        set((state) => ({
            posts: state.posts.map((p) =>
                p.id === postId ? { ...p, earnings: p.earnings + price } : p
            ),
            giftAnimations: {
                ...state.giftAnimations,
                [postId]: { emoji, key: Date.now() },
            },
            notifications: extraNotifications.length
                ? [...extraNotifications, ...state.notifications]
                : state.notifications,
            unreadNotifications: state.unreadNotifications + extraNotifications.length,
        }))

        // Trigger specialized "real" animations
        if (id === 'egg' || id === 'tomato' || id === 'heart') {
            set((state) => ({
                splats: { ...state.splats, [postId]: { type: id, key: Date.now() } }
            }))
        } else if (id === 'rose') {
            set((state) => ({ roseTrigger: state.roseTrigger + 1 }))
        }
    },

    clearGiftAnimation: (postId) => set((state) => ({
        giftAnimations: { ...state.giftAnimations, [postId]: null },
    })),

    clearSplat: (postId) => set((state) => ({
        splats: { ...state.splats, [postId]: null },
    })),

    toggleFollow: (creatorId) => set((state) => ({
        posts: state.posts.map((p) =>
            p.creator.id === creatorId
                ? { ...p, creator: { ...p.creator, isFollowing: !p.creator.isFollowing } }
                : p
        ),
    })),

    addComment: (postId, comment) => set((state) => {
        const text = String(comment || '').trim()
        if (!text) return state
        return {
            posts: state.posts.map((p) =>
                p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p,
            ),
        }
    }),

    sharePost: (postId, channel = 'copy_link') => set((state) => ({
        posts: state.posts.map((p) =>
            p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p,
        ),
        notifications: [
            {
                id: `share_${Date.now()}`,
                type: 'share',
                title: 'Post shared',
                subtitle: `Shared via ${channel.replace('_', ' ')}`,
                createdAt: new Date().toISOString(),
            },
            ...state.notifications,
        ],
    })),

    markNotificationsRead: () => set({ unreadNotifications: 0 }),
}))

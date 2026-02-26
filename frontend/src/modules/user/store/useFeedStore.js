import { create } from 'zustand'
import { mockPosts } from '../data/mockPosts'

export const useFeedStore = create((set, get) => ({
    posts: mockPosts,
    giftAnimations: {}, // postId -> { emoji, key }
    splats: {}, // postId -> { type, key }
    roseTrigger: 0,

    toggleLike: (postId) => set((state) => ({
        posts: state.posts.map((p) =>
            p.id === postId
                ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
                : p
        ),
    })),

    sendGift: (postId, gift) => {
        const { id, price, emoji } = gift

        set((state) => ({
            posts: state.posts.map((p) =>
                p.id === postId ? { ...p, earnings: p.earnings + price } : p
            ),
            giftAnimations: {
                ...state.giftAnimations,
                [postId]: { emoji, key: Date.now() },
            },
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
}))

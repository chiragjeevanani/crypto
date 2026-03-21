import { create } from 'zustand'
import { postService } from '../services/postService'
import { followService } from '../services/followService'
import { savedPostService } from '../services/savedPostService'

const getStoredCurrencySymbol = () => {
    try {
        const raw = localStorage.getItem('crypto_auth_user')
        if (!raw) return '₹'
        const user = JSON.parse(raw)
        return user?.currencySymbol || '₹'
    } catch {
        return '₹'
    }
}

// Post IDs the current user has already shared (so we only count once per user when API fails or mock data)
const SHARED_POST_IDS_KEY = 'crypto_feed_shared_post_ids';

const getSharedPostIds = () => {
    try {
        const raw = localStorage.getItem(SHARED_POST_IDS_KEY)
        if (!raw) return new Set()
        return new Set(JSON.parse(raw))
    } catch {
        return new Set()
    }
}

const saveSharedPostIds = (set) => {
    try {
        localStorage.setItem(SHARED_POST_IDS_KEY, JSON.stringify([...set]))
    } catch { /* ignore */ }
}

export const useFeedStore = create((set, get) => ({
    posts: [],
    postsLoading: false,
    postsError: null,
    commentsByPostId: {},
    commentsLoading: {},
    savedPostIds: new Set(),

    addPost: (post) => set((state) => ({
        posts: [post, ...state.posts],
    })),

    loadPosts: async () => {
        set({ postsLoading: true, postsError: null })
        try {
            const res = await postService.getPosts()
            const list = res?.posts || []
            // Always reflect backend state, even if empty (no mock fallback)
            set({ posts: list })
        } catch (err) {
            set({ postsError: err?.message || 'Failed to load feed' })
        } finally {
            set({ postsLoading: false })
        }
    },

    loadComments: async (postId) => {
        set((state) => ({ commentsLoading: { ...state.commentsLoading, [postId]: true } }))
        try {
            const res = await postService.getComments(postId)
            const list = res?.comments || []
            set((state) => ({
                commentsByPostId: { ...state.commentsByPostId, [postId]: list },
                commentsLoading: { ...state.commentsLoading, [postId]: false },
            }))
            return list
        } catch (err) {
            set((state) => ({ commentsLoading: { ...state.commentsLoading, [postId]: false } }))
            return []
        }
    },

    giftAnimations: {}, // postId -> { emoji, key }
    splats: {}, // postId -> { type, key }
    giftCountsByPostId: {}, // postId -> { giftId: count }
    earningsByPostId: {}, // postId -> total earnings from gifts
    roseTrigger: 0,
    notifications: [],
    unreadNotifications: 0,

    toggleLike: async (postId) => {
        try {
            const res = await postService.likePost(postId)
            set((state) => ({
                posts: state.posts.map((p) =>
                    p.id === postId
                        ? { ...p, isLiked: res.liked, likes: res.likes ?? (res.liked ? p.likes + 1 : p.likes - 1) }
                        : p
                ),
            }))
        } catch {
            set((state) => ({
                posts: state.posts.map((p) =>
                    p.id === postId
                        ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
                        : p
                ),
            }))
        }
    },

    sendGift: (postId, gift) => {
        const { id, price, emoji } = gift
        const target = get().posts.find((p) => p.id === postId)
        if (target && target.allowGifts === false) return

        const extraNotifications = []
        if (price >= 10) {
            extraNotifications.push({
                id: `note_${Date.now()}`,
                type: 'premium_gift',
                title: `Premium gift broadcast: ${getStoredCurrencySymbol()}${price} ${gift.name}`,
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
            giftCountsByPostId: {
                ...state.giftCountsByPostId,
                [postId]: {
                    ...(state.giftCountsByPostId[postId] || {}),
                    [id]: ((state.giftCountsByPostId[postId] || {})[id] || 0) + 1,
                },
            },
            earningsByPostId: {
                ...state.earningsByPostId,
                [postId]: (state.earningsByPostId[postId] || 0) + price,
            },
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

    toggleFollow: async (creatorId) => {
        try {
            const res = await followService.toggleFollow(creatorId)
            const isFollowing = !!res.following
            const followerCount = typeof res.followerCount === 'number' ? res.followerCount : null
            set((state) => ({
                posts: state.posts.map((p) =>
                    p.creator.id === creatorId
                        ? {
                            ...p,
                            creator: {
                                ...p.creator,
                                isFollowing,
                                followers: followerCount !== null ? followerCount : p.creator.followers,
                            },
                        }
                        : p
                ),
            }))
            return res
        } catch (error) {
            // Fallback: optimistic toggle in UI only
            set((state) => ({
                posts: state.posts.map((p) =>
                    p.creator.id === creatorId
                        ? {
                            ...p,
                            creator: {
                                ...p.creator,
                                isFollowing: !p.creator.isFollowing,
                            },
                        }
                        : p
                ),
            }))
            throw error
        }
    },

    addComment: async (postId, text) => {
        const trimmed = String(text || '').trim()
        if (!trimmed) return
        try {
            const res = await postService.addComment(postId, trimmed)
            const comment = res?.comment
            set((state) => {
                const nextComments = [...(state.commentsByPostId[postId] || []), comment].filter(Boolean)
                return {
                    commentsByPostId: { ...state.commentsByPostId, [postId]: nextComments },
                    posts: state.posts.map((p) =>
                        p.id === postId ? { ...p, comments: res.commentCount ?? (p.comments || 0) + 1 } : p
                    ),
                }
            })
            return comment
        } catch (err) {
            throw err
        }
    },

    sharePost: async (postId, channel = 'copy_link') => {
        const idStr = String(postId)
        try {
            const res = await postService.sharePost(postId)
            const raw = res?.shares
            const count = typeof raw === 'number' ? raw : (raw != null ? Number(raw) : null)
            set((s) => ({
                posts: s.posts.map((p) =>
                    String(p.id) === idStr
                        ? { ...p, shares: count !== null && !Number.isNaN(count) ? count : (p.shares || 0) }
                        : p,
                ),
                notifications: [
                    {
                        id: `share_${Date.now()}`,
                        type: 'share',
                        title: 'Post shared',
                        subtitle: `Shared via ${channel.replace('_', ' ')}`,
                        createdAt: new Date().toISOString(),
                    },
                    ...s.notifications,
                ],
            }))
        } catch {
            // If the API fails, do not change the local share count.
            // This keeps the UI consistent with the database (shares are stored in DB only).
        }
    },

    pushNotification: (payload) => set((state) => {
        const next = {
            id: payload?.id || `note_${Date.now()}`,
            type: payload?.type || 'system',
            title: payload?.title || 'New update',
            subtitle: payload?.subtitle || '',
            createdAt: payload?.createdAt || new Date().toISOString(),
        }
        return {
            notifications: [next, ...state.notifications],
            unreadNotifications: state.unreadNotifications + 1,
        }
    }),

    markNotificationsRead: () => set({ unreadNotifications: 0 }),

    fetchSavedPostIds: async () => {
        try {
            const res = await savedPostService.getSavedPostIds()
            set({ savedPostIds: new Set(res.ids || []) })
        } catch (err) {
            console.error('Failed to fetch saved post IDs:', err)
        }
    },

    toggleSavePost: async (postId) => {
        const idStr = String(postId)
        const isCurrentlySaved = get().savedPostIds.has(idStr)
        
        // Optimistic update
        const newSet = new Set(get().savedPostIds)
        if (isCurrentlySaved) newSet.delete(idStr)
        else newSet.add(idStr)
        set({ savedPostIds: newSet })

        try {
            const res = await savedPostService.toggleSave(postId)
            const syncedSet = new Set(get().savedPostIds)
            if (res.isSaved) syncedSet.add(idStr)
            else syncedSet.delete(idStr)
            set({ savedPostIds: syncedSet })
        } catch (err) {
            // Revert on error
            const revertedSet = new Set(get().savedPostIds)
            if (isCurrentlySaved) revertedSet.add(idStr)
            else revertedSet.delete(idStr)
            set({ savedPostIds: revertedSet })
            throw err
        }
    },
}))

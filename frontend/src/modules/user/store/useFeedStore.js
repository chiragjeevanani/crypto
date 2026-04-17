import { create } from 'zustand'
import { postService } from '../services/postService'
import { followService } from '../services/followService'
import { savedPostService } from '../services/savedPostService'
import { userCampaignService } from '../services/campaignService'
import { notificationService } from '../services/notificationService'
import { useUserStore } from './useUserStore'

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

    fetchSinglePost: async (postId) => {
        if (!postId) return null
        try {
            const res = await postService.getPostById(postId)
            if (res?.post) {
                set((state) => {
                    const exists = state.posts.find(p => p.id === res.post.id)
                    if (exists) return { ...state }
                    return { posts: [res.post, ...state.posts] }
                })
                return res.post
            }
        } catch (err) {
            console.error('Failed to fetch single post:', err)
        }
        return null
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
    notificationsLoading: false,
    unreadNotifications: 0,
    suggestions: [],
    suggestionsLoading: false,

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
        const { id, price, emoji, animationType } = gift
        const animId = animationType || id
        const target = get().posts.find((p) => p.id === postId)
        if (target && target.allowGifts === false) return

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
        }))

        // Trigger specialized animations
        if (animId === 'egg' || animId === 'tomato' || animId === 'heart') {
            set((state) => ({
                splats: { ...state.splats, [postId]: { type: animId, key: Date.now() } }
            }))
        } else if (animId === 'rose') {
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
            
            // Dispatch global event for other components to sync
            window.dispatchEvent(new CustomEvent('user-follow-changed', { 
                detail: { creatorId, isFollowing, followerCount } 
            }))

            set((state) => ({
                posts: state.posts.map((p) =>
                    p.creator?.id === creatorId
                        ? {
                            ...p,
                            creator: {
                                ...p.creator,
                                isFollowing,
                                followers: followerCount !== null ? followerCount : p.creator?.followers,
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
                    p.creator?.id === creatorId
                        ? {
                            ...p,
                            creator: {
                                ...p.creator,
                                isFollowing: !p.creator?.isFollowing,
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

    recordView: async (postId) => {
        try {
            const res = await postService.recordView(postId)
            if (res.success && !res.alreadyViewed) {
                set((state) => ({
                    posts: state.posts.map((p) =>
                        p.id === postId ? { ...p, views: res.views } : p
                    ),
                }))
            }
        } catch {
            // silence view errors
        }
    },

    // ─── Notification Actions (DB-backed) ────────────────────────────────────
    loadNotifications: async () => {
        set({ notificationsLoading: true })
        try {
            const res = await notificationService.getNotifications()
            set({
                notifications: res.notifications || [],
                unreadNotifications: res.unreadCount || 0,
                notificationsLoading: false
            })
        } catch (err) {
            console.error('[Notifications] Failed to load:', err.message)
            set({ notificationsLoading: false })
        }
    },

    markNotificationsRead: async () => {
        set({ unreadNotifications: 0 })
        try {
            await notificationService.markAllRead()
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
            }))
        } catch (err) {
            console.error('[Notifications] Failed to mark all read:', err.message)
        }
    },

    markOneNotificationRead: async (id) => {
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, isRead: true } : n
            ),
            unreadNotifications: Math.max(0, state.unreadNotifications - 1)
        }))
        try {
            await notificationService.markOneRead(id)
        } catch (err) {
            console.error('[Notifications] Failed to mark one read:', err.message)
        }
    },

    // Called by SocketHandler when a live notification arrives
    addLiveNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadNotifications: state.unreadNotifications + 1
    })),

    // Legacy alias for components that still call pushNotification
    pushNotification: (payload) => set((state) => {
        const next = {
            id: payload?.id || `note_${Date.now()}`,
            type: payload?.type || 'system',
            title: payload?.title || 'New update',
            subtitle: payload?.subtitle || '',
            createdAt: payload?.createdAt || new Date().toISOString(),
            isRead: false
        }
        return {
            notifications: [next, ...state.notifications],
            unreadNotifications: state.unreadNotifications + 1,
        }
    }),

    // ─── Suggestions (Who to Follow) ─────────────────────────────────────────
    loadSuggestions: async () => {
        set({ suggestionsLoading: true })
        try {
            const res = await notificationService.getSuggestions()
            set({ suggestions: res.suggestions || [], suggestionsLoading: false })
        } catch (err) {
            console.error('[Suggestions] Failed to load:', err.message)
            set({ suggestionsLoading: false })
        }
    },

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

    voteCampaignSubmission: async (campaignId, submissionId, postId) => {
        try {
            const res = await userCampaignService.vote(campaignId, submissionId)
            if (res.success) {
                set((state) => ({
                    posts: state.posts.map((p) =>
                        String(p.id) === String(postId)
                            ? { ...p, votes: res.votes, hasVoted: true }
                            : p
                    ),
                }))
            }
            return res
        } catch (error) {
            throw error
        }
    },

    deletePost: async (postId) => {
        try {
            await postService.deletePost(postId)
            set((state) => ({
                posts: state.posts.filter((p) => String(p.id) !== String(postId))
            }))
        } catch (err) {
            console.error('Failed to delete post:', err)
            throw err
        }
    },
}))

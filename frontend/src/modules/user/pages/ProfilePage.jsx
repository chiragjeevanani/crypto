import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { X, Moon, Sun, Settings, Shield, FileText, Phone, ChevronRight, ArrowLeft, Clock3, Play, Bookmark, Send } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import { useFeedStore } from '../store/useFeedStore'
import ProfileHeader from '../components/profile/ProfileHeader'
import NFTBadge from '../components/shared/NFTBadge'
import PostFeedModal from '../components/feed/PostFeedModal'
import { userCampaignService } from '../services/campaignService'
import { mapCampaignToTask } from '../utils/campaignMapper'
import { getJoinedCampaignIds } from '../utils/campaignStorage'
import { getUserNFTListings } from '../../../shared/nftListings'
import { followService } from '../services/followService'
import { searchService } from '../services/searchService'
import SuggestedUserCard from '../components/feed/SuggestedUserCard'
import SuggestedUsersSection from '../components/feed/SuggestedUsersSection'

import { savedPostService } from '../services/savedPostService'

const TABS = ['Posts', 'NFTs', 'Tasks']
const SETTINGS_SECTIONS = ['Saved Posts', 'Personal Information', 'Change Password', 'Usage & Screen Time', 'Terms & Policies', 'Contacts']

export default function ProfilePage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { profile, updateProfile, toggleDarkMode, darkMode, user } = useUserStore()
    const { posts, loadPosts } = useFeedStore()
    const profilePosts = useMemo(() => posts.filter((p) => String(p.creator?.id) === String(profile?.id)), [posts, profile?.id])
    const [activeTab, setActiveTab] = useState('Posts')
    const [editOpen, setEditOpen] = useState(false)
    const [activePostIndex, setActivePostIndex] = useState(null)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [settingsTab, setSettingsTab] = useState('Personal Information')
    const [settingsMode, setSettingsMode] = useState('menu')
    const [connectionsOpen, setConnectionsOpen] = useState(null)
    const [editAvatar, setEditAvatar] = useState(null)
    const [editAvatarFile, setEditAvatarFile] = useState(null)
    const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
    const [passwordMsg, setPasswordMsg] = useState('')
    const [screenTimeLabel, setScreenTimeLabel] = useState('0m')
    const [followers, setFollowers] = useState([])
    const [following, setFollowing] = useState([])
    const [joinedCampaigns, setJoinedCampaigns] = useState([])
    const [joinedCampaignsLoading, setJoinedCampaignsLoading] = useState(false)
    const [nftListings, setNftListings] = useState([])
    const [savedPosts, setSavedPosts] = useState([])
    const [savedLoading, setSavedLoading] = useState(false)

    const { register, handleSubmit, reset: resetEditForm } = useForm({ defaultValues: { username: profile.username, bio: profile.bio } })
    const settingsForm = useForm({
        defaultValues: {
            fullName: profile.fullName || profile.username,
            username: profile.username,
            handle: profile.handle,
            email: profile.email || '',
            phone: profile.phone || '',
            bio: profile.bio,
        },
    })

    const [profileSaveError, setProfileSaveError] = useState('')
    const [profileSaving, setProfileSaving] = useState(false)

    const onEdit = async (data) => {
        setProfileSaveError('')
        setProfileSaving(true)
        try {
            await updateProfile({
                name: data.username || profile.fullName,
                bio: data.bio,
                ...(editAvatarFile ? { avatarFile: editAvatarFile } : {}),
            })
            await loadPosts()
            setEditAvatar(null)
            setEditAvatarFile(null)
            setEditOpen(false)
        } catch (err) {
            setProfileSaveError(err?.message || 'Failed to save profile')
        } finally {
            setProfileSaving(false)
        }
    }

    const onSavePersonalInfo = async (data) => {
        setProfileSaveError('')
        setProfileSaving(true)
        try {
            await updateProfile({
                fullName: data.fullName,
                username: data.username,
                handle: data.handle?.startsWith('@') ? data.handle : `@${data.handle || ''}`,
                email: data.email,
                phone: data.phone,
                bio: data.bio,
            })
            await loadPosts()
            setSettingsOpen(false)
        } catch (err) {
            setProfileSaveError(err?.message || 'Failed to save profile')
        } finally {
            setProfileSaving(false)
        }
    }

    const onChangePassword = () => {
        if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
            setPasswordMsg('Please fill all password fields.')
            return
        }
        if (passwordForm.next !== passwordForm.confirm) {
            setPasswordMsg('New password and confirm password do not match.')
            return
        }
        setPasswordMsg('Password changed successfully.')
        setPasswordForm({ current: '', next: '', confirm: '' })
    }

    useEffect(() => {
        settingsForm.reset({
            fullName: profile.fullName || profile.username,
            username: profile.username,
            handle: profile.handle,
            email: profile.email || '',
            phone: profile.phone || '',
            bio: profile.bio,
        })
    }, [profile.id, profile.email, profile.fullName, profile.username, profile.handle, profile.phone, profile.bio])
    useEffect(() => {
        if (!editOpen) return
        resetEditForm({ username: profile.username, bio: profile.bio })
    }, [editOpen, profile.username, profile.bio, resetEditForm])

    useEffect(() => { loadPosts() }, [loadPosts])

    const closeEdit = () => {
        setEditOpen(false)
        if (editAvatar && typeof editAvatar === 'string' && editAvatar.startsWith('blob:')) {
            URL.revokeObjectURL(editAvatar)
        }
        setEditAvatar(null)
        setEditAvatarFile(null)
    }

    useEffect(() => {
        const hydrate = () => setNftListings(getUserNFTListings())
        hydrate()
        const onUpdate = () => hydrate()
        const onStorage = (event) => {
            if (event.key === 'socialearn_user_nft_listings_v1') hydrate()
        }
        window.addEventListener('nft-listings-updated', onUpdate)
        window.addEventListener('storage', onStorage)
        return () => {
            window.removeEventListener('nft-listings-updated', onUpdate)
            window.removeEventListener('storage', onStorage)
        }
    }, [])

    useEffect(() => {
        let mounted = true
        const load = async () => {
            setJoinedCampaignsLoading(true)
            try {
                const joinedIds = new Set(getJoinedCampaignIds())
                const list = await userCampaignService.listActive()
                const joined = (list || [])
                    .filter((campaign) => joinedIds.has(String(campaign.id)))
                    .map((campaign) => mapCampaignToTask(campaign, true))
                    .filter(Boolean)
                if (mounted) setJoinedCampaigns(joined)
            } catch {
                if (mounted) setJoinedCampaigns([])
            } finally {
                if (mounted) setJoinedCampaignsLoading(false)
            }
        }
        load()
        const onJoined = () => load()
        const onStorage = (event) => {
            if (event.key === 'crypto_joined_campaigns_v1') load()
        }
        window.addEventListener('user-campaigns-joined', onJoined)
        window.addEventListener('storage', onStorage)
        return () => {
            mounted = false
            window.removeEventListener('user-campaigns-joined', onJoined)
            window.removeEventListener('storage', onStorage)
        }
    }, [])

    // Load followers / following for the logged-in user from backend
    useEffect(() => {
        if (settingsTab !== 'Saved Posts' || !profile.id || !settingsOpen) return
        let mounted = true
        const load = async () => {
            setSavedLoading(true)
            try {
                const res = await savedPostService.getSavedPosts(profile.id)
                if (mounted) setSavedPosts(res.data || [])
            } catch (err) {
                console.error("Failed to load saved posts:", err)
            } finally {
                if (mounted) setSavedLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [settingsTab, profile.id, settingsOpen])

    useEffect(() => {
        const userId = profile?.id
        if (!userId) return
        let cancelled = false
        const load = async () => {
            try {
                const [fRes, gRes] = await Promise.all([
                    followService.getFollowers(userId),
                    followService.getFollowing(userId),
                ])
                if (cancelled) return
                setFollowers(Array.isArray(fRes.followers) ? fRes.followers : [])
                setFollowing(Array.isArray(gRes.following) ? gRes.following : [])
            } catch {
                if (!cancelled) {
                    setFollowers([])
                    setFollowing([])
                }
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [profile.id])

    useEffect(() => {
        const state = location.state
        if (!state?.openSettings) return
        setSettingsOpen(true)
        setSettingsMode(state.settingsMode || 'menu')
        setSettingsTab(state.settingsTab || 'Personal Information')
        navigate(location.pathname, { replace: true, state: null })
    }, [location.pathname, location.state, navigate])

    useEffect(() => {
        const key = 'socialearn_screen_time_start_v1'
        const todayKey = new Date().toISOString().slice(0, 10)
        const startValue = window.localStorage.getItem(key)
        const parsed = startValue ? JSON.parse(startValue) : null
        if (!parsed || parsed.day !== todayKey) {
            window.localStorage.setItem(key, JSON.stringify({ day: todayKey, startAt: Date.now() }))
        }

        const formatDuration = (ms) => {
            const totalMinutes = Math.max(0, Math.floor(ms / 60000))
            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60
            if (hours === 0) return `${minutes}m`
            return `${hours}h ${minutes}m`
        }

        const tick = () => {
            const raw = window.localStorage.getItem(key)
            const current = raw ? JSON.parse(raw) : { day: todayKey, startAt: Date.now() }
            setScreenTimeLabel(formatDuration(Date.now() - Number(current.startAt || Date.now())))
        }

        tick()
        const timer = window.setInterval(tick, 30000)
        return () => window.clearInterval(timer)
    }, [])

    return (
        <div>
            <ProfileHeader
                profile={{ ...profile, posts: profilePosts.length, followers: followers.length, following: following.length }}
                onEdit={() => setEditOpen(true)}
                onOpenFollowers={() => setConnectionsOpen('followers')}
                onOpenFollowing={() => setConnectionsOpen('following')}
            />

            <div className="flex items-center justify-end gap-2 px-4 mb-3">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        setSettingsMode('menu')
                        setSettingsOpen(true)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                    <Settings size={13} /> Settings
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleDarkMode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                    {darkMode ? <Sun size={13} /> : <Moon size={13} />}
                </motion.button>
            </div>

            <SuggestedUsersSection />

            <div className="flex border-b px-4" style={{ borderColor: 'var(--color-border)' }}>
                {TABS.map((tab) => {
                    const active = tab === activeTab
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="flex-1 pb-2.5 text-sm font-semibold cursor-pointer transition-colors relative"
                            style={{ color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}
                        >
                            {tab}
                            {active && <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--color-primary)' }} />}
                        </button>
                    )
                })}
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    {activeTab === 'Posts' && (
                        <div className="grid grid-cols-3 gap-0.5 p-0.5">
                            {profilePosts.map((post) => (
                                <div
                                    key={post.id}
                                    className="relative cursor-pointer overflow-hidden"
                                    style={{ aspectRatio: '1' }}
                                    onClick={() => setActivePostIndex(profilePosts.findIndex((item) => item.id === post.id))}
                                >
                                    {post.media?.type === 'video' ? (
                                        <>
                                            <video
                                                src={post.media?.url || post.thumbnail}
                                                muted
                                                playsInline
                                                preload="none"
                                                poster={post.media?.thumbnail || post.thumbnail}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                                                    <Play size={22} className="text-white" fill="white" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <img src={post.media?.url || post.thumbnail} alt="post" className="w-full h-full object-cover" loading="lazy" />
                                    )}
                                    <div className="absolute bottom-1 right-1">
                                        <span className="text-[9px] font-bold px-1 py-0.5 rounded-sm" style={{ background: 'rgba(245,158,11,0.9)', color: '#fff' }}>₹{post.earnings ?? 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'NFTs' && (
                        <div className="px-4 py-3 flex flex-col gap-3">
                            {nftListings.length === 0 && (
                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No NFTs listed yet.</p>
                            )}
                            {nftListings.map((nft) => (
                                <div key={nft.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--color-surface2)' }}>
                                        {nft.mediaType === 'video' && nft.mediaUrl ? (
                                            <video
                                                src={nft.thumbnail || (nft.mediaType === 'video' ? nft.mediaUrl : '')}
                                                muted
                                                loop
                                                playsInline
                                                preload="none"
                                                crossOrigin="anonymous"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <img
                                                src={nft.thumbnail || (nft.mediaType === 'image' ? nft.mediaUrl : '')}
                                                alt={nft.title}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{nft.title}</p>
                                        <NFTBadge status={nft.status} price={nft.price} className="mt-1" />
                                        <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>{nft.views} views · {nft.bids} bids</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'Tasks' && (
                        <div className="px-4 py-3 flex flex-col gap-3">
                            {joinedCampaignsLoading && (
                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Loading joined campaigns...</p>
                            )}
                            {!joinedCampaignsLoading && joinedCampaigns.length === 0 && (
                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No joined campaigns yet.</p>
                            )}
                            {joinedCampaigns.map((task) => (
                                <div key={task.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: '#FF3F6C' }}>{task.brand.name.charAt(0)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{task.title}</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{task.brand.name}</p>
                                     </div>
                                    <span className="text-sm font-bold" style={{ color: 'var(--color-success)' }}>+₹{task.myReward}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Saved Tab removed from main profile */}
                </motion.div>
            </AnimatePresence>
            <PostFeedModal 
                posts={settingsTab === 'Saved Posts' && settingsOpen ? savedPosts : profilePosts} 
                startIndex={activePostIndex} 
                onClose={() => setActivePostIndex(null)} 
            />

            <AnimatePresence>
                {editOpen && (
                    <motion.div className="fixed inset-0 z-40 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.6)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeEdit}>
                        <motion.div className="rounded-t-3xl px-5 pt-4 pb-[calc(var(--bottom-nav-height)+16px)]" style={{ background: 'var(--color-surface)' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 280, damping: 30 }} onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center mb-4"><div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} /></div>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Edit Profile</p>
                                <button onClick={closeEdit} className="cursor-pointer"><X size={18} style={{ color: 'var(--color-muted)' }} /></button>
                            </div>
                            <form onSubmit={handleSubmit(onEdit)} className="flex flex-col gap-4">
                                {profileSaveError && <p className="text-xs text-red-500">{profileSaveError}</p>}
                                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
                                    <div className="w-12 h-12 rounded-full overflow-hidden" style={{ background: 'var(--color-surface)' }}>
                                        {(editAvatar || profile.avatar)
                                            ? <img src={editAvatar || profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ color: 'var(--color-muted)' }}>{(profile.username || user?.name || '').charAt(0)}</div>}
                                    </div>
                                    <label className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                                        Change Profile Photo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (!file) return
                                                if (editAvatar && editAvatar.startsWith('blob:')) {
                                                    URL.revokeObjectURL(editAvatar)
                                                }
                                                setEditAvatarFile(file)
                                                setEditAvatar(URL.createObjectURL(file))
                                            }}
                                        />
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sub)' }}>Display Name</label>
                                    <input {...register('username')} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sub)' }}>Bio</label>
                                    <textarea {...register('bio')} rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                                </div>
                                <motion.button type="submit" disabled={profileSaving} whileTap={{ scale: 0.96 }} className="w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))', color: '#fff' }}>
                                    {profileSaving ? 'Saving...' : 'Save Changes'}
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {connectionsOpen && (
                    <motion.div className="fixed inset-0 z-[120] flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.6)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConnectionsOpen(null)}>
                        <motion.div className="rounded-t-3xl px-5 pt-4 pb-8 max-h-[70vh] overflow-y-auto pb-[var(--bottom-nav-height)]" style={{ background: 'var(--color-surface)' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 280, damping: 30 }} onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center mb-4"><div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} /></div>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-base font-bold" style={{ color: 'var(--color-text)' }}>{connectionsOpen === 'followers' ? 'Followers' : 'Following'}</p>
                                <button onClick={() => setConnectionsOpen(null)} className="cursor-pointer"><X size={18} style={{ color: 'var(--color-muted)' }} /></button>
                            </div>
                            <div className="space-y-2">
                                {(connectionsOpen === 'followers' ? followers : following).map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{item.name}</p>
                                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{item.handle}</p>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConnectionsOpen(null);
                                                navigate('/messaging', { state: { openChat: { id: item.id, username: item.name, handle: item.handle, avatar: item.avatar } } });
                                            }}
                                            className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
                                            style={{ color: 'var(--color-primary)' }}
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {settingsOpen && (
                    <motion.div className="fixed inset-0 z-50 flex justify-end p-2 md:p-3" style={{ background: 'rgba(0,0,0,0.55)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSettingsOpen(false)}>
                        <motion.div className="h-full w-full max-w-md overflow-hidden rounded-2xl" initial={{ x: 36, opacity: 0.96 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 36, opacity: 0.96 }} transition={{ duration: 0.22, ease: 'easeOut' }} onClick={(e) => e.stopPropagation()}>
                            <div className="h-full rounded-2xl p-4 overflow-y-auto" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        {settingsMode === 'detail' && (
                                            <button onClick={() => setSettingsMode('menu')} className="p-1.5 rounded-md" style={{ background: 'var(--color-surface2)' }}>
                                                <ArrowLeft size={14} style={{ color: 'var(--color-text)' }} />
                                            </button>
                                        )}
                                        <p className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                                            {settingsMode === 'menu' ? 'Settings' : settingsTab}
                                        </p>
                                    </div>
                                    <button onClick={() => setSettingsOpen(false)}><X size={18} style={{ color: 'var(--color-muted)' }} /></button>
                                </div>                                 {settingsMode === 'menu' && (
                                    <div className="space-y-2 mb-2">
                                        {SETTINGS_SECTIONS.map((section) => (
                                            <button
                                                key={section}
                                                onClick={() => {
                                                    setSettingsTab(section)
                                                    setSettingsMode('detail')
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold"
                                                style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {section === 'Saved Posts' && <Bookmark size={15} style={{ color: 'var(--color-primary)' }} />}
                                                    <span>{section}</span>
                                                </div>
                                                <ChevronRight size={15} style={{ color: 'var(--color-muted)' }} />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {settingsMode === 'detail' && settingsTab === 'Saved Posts' && (
                                    <div className="min-h-[200px] -mx-4 -mb-4">
                                        {savedLoading && (
                                            <div className="grid grid-cols-3 gap-0.5">
                                                {[1, 2, 3, 4, 5, 6].map(i => (
                                                    <div key={i} className="aspect-square bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                                                ))}
                                            </div>
                                        )}
                                        {!savedLoading && savedPosts.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-20 px-8">
                                                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--color-surface2)' }}>
                                                    <Bookmark size={30} style={{ color: 'var(--color-muted)' }} />
                                                </div>
                                                <p className="text-sm font-bold text-center" style={{ color: 'var(--color-text)' }}>No saved posts yet</p>
                                                <p className="text-xs text-center mt-1" style={{ color: 'var(--color-muted)' }}>When you save posts and reels, they'll appear here.</p>
                                            </div>
                                        )}
                                        {!savedLoading && savedPosts.length > 0 && (
                                            <div className="grid grid-cols-3 gap-0.5">
                                                {savedPosts.map((post) => (
                                                    <div
                                                        key={post.id}
                                                        className="relative cursor-pointer overflow-hidden aspect-square"
                                                        onClick={() => setActivePostIndex(savedPosts.findIndex((item) => item.id === post.id))}
                                                    >
                                                        {post.media?.type === 'video' ? (
                                                            <>
                                                                <video
                                                                    src={post.media?.url}
                                                                    muted
                                                                    playsInline
                                                                    preload="none"
                                                                    poster={post.media?.thumbnail || post.media?.poster}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                    <Play size={20} className="text-white opacity-90" fill="white" />
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <img src={post.media?.url} alt="saved post" className="w-full h-full object-cover" loading="lazy" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {settingsMode === 'detail' && settingsTab === 'Personal Information' && (
                                    <form onSubmit={settingsForm.handleSubmit(onSavePersonalInfo)} className="space-y-3">
                                        {profileSaveError && <p className="text-xs text-red-500">{profileSaveError}</p>}
                                        <input {...settingsForm.register('fullName')} placeholder="Full Name" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                                        <input {...settingsForm.register('username')} placeholder="User Name" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                                        <input {...settingsForm.register('handle')} placeholder="@handle" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                                        <input {...settingsForm.register('email')} placeholder="Email" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                                        <input {...settingsForm.register('phone')} placeholder="Phone Number" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                                        <textarea {...settingsForm.register('bio')} rows={3} placeholder="Bio" className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                                        <button type="submit" disabled={profileSaving} className="w-full py-2.5 rounded-lg text-sm font-bold disabled:opacity-50" style={{ background: 'var(--color-primary)', color: '#fff' }}>{profileSaving ? 'Saving...' : 'Save Personal Information'}</button>
                                    </form>
                                )}
                                {settingsMode === 'detail' && settingsTab === 'Change Password' && (
                                    <div className="space-y-3">
                                        <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))} placeholder="Current Password" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                                        <input type="password" value={passwordForm.next} onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))} placeholder="New Password" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                                        <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} placeholder="Confirm New Password" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                                        <button onClick={onChangePassword} className="w-full py-2.5 rounded-lg text-sm font-bold" style={{ background: 'var(--color-primary)', color: '#fff' }}>Update Password</button>
                                        {passwordMsg && <p className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>{passwordMsg}</p>}
                                    </div>
                                )}
                                {settingsMode === 'detail' && settingsTab === 'Usage & Screen Time' && (
                                    <div className="space-y-3">
                                        <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
                                            <Clock3 size={14} style={{ color: 'var(--color-primary)' }} />
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Today Screen Time</p>
                                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{screenTimeLabel}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {settingsMode === 'detail' && settingsTab === 'Terms & Policies' && (
                                    <div className="space-y-2">
                                        <button onClick={() => { setSettingsOpen(false); navigate('/terms', { state: { openSettingsOnBack: { openSettings: true, settingsMode: 'detail', settingsTab: 'Terms & Policies' } } }) }} className="w-full p-3 rounded-lg flex items-center gap-2 text-left" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}><FileText size={14} style={{ color: 'var(--color-primary)' }} /><p className="text-sm" style={{ color: 'var(--color-text)' }}>Terms & Conditions</p></button>
                                        <button onClick={() => { setSettingsOpen(false); navigate('/privacy', { state: { openSettingsOnBack: { openSettings: true, settingsMode: 'detail', settingsTab: 'Terms & Policies' } } }) }} className="w-full p-3 rounded-lg flex items-center gap-2 text-left" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}><Shield size={14} style={{ color: 'var(--color-primary)' }} /><p className="text-sm" style={{ color: 'var(--color-text)' }}>Privacy Policy</p></button>
                                        <button onClick={() => { setSettingsOpen(false); navigate('/guidelines', { state: { openSettingsOnBack: { openSettings: true, settingsMode: 'detail', settingsTab: 'Terms & Policies' } } }) }} className="w-full p-3 rounded-lg flex items-center gap-2 text-left" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}><FileText size={14} style={{ color: 'var(--color-primary)' }} /><p className="text-sm" style={{ color: 'var(--color-text)' }}>Community Guidelines</p></button>
                                    </div>
                                )}
                                {settingsMode === 'detail' && settingsTab === 'Contacts' && (
                                    <div className="space-y-2">
                                        <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}><Phone size={14} style={{ color: 'var(--color-primary)' }} /><div><p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Support</p><p className="text-xs" style={{ color: 'var(--color-muted)' }}>support@socialearn.app</p></div></div>
                                        <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}><Phone size={14} style={{ color: 'var(--color-primary)' }} /><div><p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Business Contact</p><p className="text-xs" style={{ color: 'var(--color-muted)' }}>+91 90000 12345</p></div></div>
                                    </div>
                                )}
                                <div className="pt-5 mt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                    <button onClick={() => { useUserStore.getState().logout(); window.location.href = '/signin' }} className="w-full py-2.5 rounded-lg text-sm font-bold" style={{ background: 'rgba(244,63,94,0.14)', color: 'var(--color-danger)', border: '1px solid rgba(244,63,94,0.25)' }}>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

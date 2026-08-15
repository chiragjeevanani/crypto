import { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { X, Moon, Sun, Settings, Shield, FileText, Phone, ChevronRight, ArrowLeft, Clock3, Play, Bookmark, Send, Eye, EyeOff, Heart, MessageCircle, Music, Globe } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUserStore, getStoredToken } from '../store/useUserStore'
import { authService } from '../../auth/services/authService'
import { useFeedStore } from '../store/useFeedStore'
import { useWalletStore } from '../store/useWalletStore'
import { formatCount } from '../utils/formatCurrency'
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
import { optimizeCloudinaryUrl } from '../../../utils/mediaOptimization'
import LogoutConfirmationModal from '../components/shared/LogoutConfirmationModal'
import DeleteAccountConfirmationModal from '../components/shared/DeleteAccountConfirmationModal'
import Stories from '../components/feed/Stories'
const TABS = ['Posts', 'NFTs', 'Tasks']
const SETTINGS_SECTIONS = ['Saved Posts', 'Personal Information', 'KYC Details', 'Content Languages', 'Change Password', 'Usage & Screen Time', 'Terms & Policies', 'Contacts']

export default function ProfilePage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { profile, updateProfile, toggleDarkMode, darkMode, user } = useUserStore()
    const { posts, loadPosts } = useFeedStore()
    const { earningsWallet, loadWallet } = useWalletStore()
    
    const profilePosts = useMemo(() => posts.filter((p) => String(p.creator?.id) === String(profile?.id)), [posts, profile?.id])
    const totalViews = useMemo(() => profilePosts.reduce((acc, p) => acc + (p.views || 0), 0), [profilePosts])
    const [activeTab, setActiveTab] = useState('Posts')
    const [editOpen, setEditOpen] = useState(false)
    const [activePostIndex, setActivePostIndex] = useState(null)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [settingsTab, setSettingsTab] = useState('Personal Information')
    const [settingsMode, setSettingsMode] = useState('menu')
    const [connectionsOpen, setConnectionsOpen] = useState(null)
    const [editAvatar, setEditAvatar] = useState(null)
    const [editAvatarFile, setEditAvatarFile] = useState(null)
    const [showAvatarSourcePicker, setShowAvatarSourcePicker] = useState(false)
    const [showAvatarActionSheet, setShowAvatarActionSheet] = useState(false)
    const fileInputRef = useRef(null)
    const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
    const [passwordMsg, setPasswordMsg] = useState('')
    const [screenTimeLabel, setScreenTimeLabel] = useState('0m')
    const [followers, setFollowers] = useState([])
    const [following, setFollowing] = useState([])
    const [joinedCampaigns, setJoinedCampaigns] = useState([])
    const [joinedCampaignsLoading, setJoinedCampaignsLoading] = useState(false)
    const [ownedNfts, setOwnedNfts] = useState([])
    const [selectedLangs, setSelectedLangs] = useState([])
    const [kycDetails, setKycDetails] = useState(null)
    const [kycLoading, setKycLoading] = useState(false)

    useEffect(() => {
        if (settingsOpen && settingsTab === 'KYC Details') {
            setKycLoading(true)
            fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/user/kyc/status`, {
                headers: { Authorization: `Bearer ${getStoredToken()}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.submission) {
                    setKycDetails(data.submission)
                } else {
                    setKycDetails(null)
                }
            })
            .catch(err => {
                console.error('Error fetching KYC:', err)
                setKycDetails(null)
            })
            .finally(() => setKycLoading(false))
        }
    }, [settingsOpen, settingsTab])

    useEffect(() => {
        if (settingsOpen && settingsTab === 'Content Languages') {
            setSelectedLangs(profile.languages || [])
        }
    }, [settingsOpen, settingsTab, profile.languages])

    useEffect(() => {
        if (!profile?.id) return;
        let mounted = true;
        fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/nft/user/${profile.id}/collection`, {
            headers: { Authorization: `Bearer ${getStoredToken()}` }
        })
        .then(res => res.json())
        .then(data => {
            if (mounted && data.success) {
                setOwnedNfts(data.nfts || []);
            }
        })
        .catch(console.error);
        return () => { mounted = false; };
    }, [profile?.id]);

    const nftListings = useMemo(() => {
        const createdNfts = profilePosts.filter(p => p.isNFT || p.postType === 'nft').map(p => ({
            ...p,
            title: p.title || p.caption || 'Untitled NFT',
            price: p.price || p.nftPriceINR || 0,
            views: p.views || 0,
            bids: p.bids || 0
        }));
        
        const mappedOwned = ownedNfts.map(o => ({
            id: o.auctionId || o.collectibleId || Math.random().toString(),
            creator: {
                id: o.creator?._id || profile.id,
                username: o.creator?.name || profile.fullName || profile.username,
                handle: o.creator?.handle || profile.handle,
                avatar: o.creator?.avatar || profile.avatar
            },
            media: { url: o.mediaUrl, type: o.mediaType },
            caption: o.description || o.title || 'Owned NFT',
            title: o.title || 'Owned NFT',
            status: o.status || 'sold',
            price: o.salePrice || 0,
            nftPriceINR: o.salePrice || 0,
            views: 0,
            bids: 0,
            thumbnail: o.mediaUrl,
            isOwned: true,
            isNFT: true,
            postType: 'nft',
            createdAt: o.acquiredAt || new Date().toISOString(),
            likes: [],
            comments: 0,
            shares: 0
        }));
        
        const combined = [...createdNfts];
        for (const owned of mappedOwned) {
            if (!combined.find(p => p.id === owned.id || (p.media?.url && p.media?.url === owned.media?.url))) {
                combined.push(owned);
            }
        }
        return combined;
    }, [profilePosts, ownedNfts])
    const [savedPosts, setSavedPosts] = useState([])
    const [savedLoading, setSavedLoading] = useState(false)
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    const { register, handleSubmit, reset: resetEditForm } = useForm({ defaultValues: { username: profile.username, bio: profile.bio } })
    const settingsForm = useForm({
        defaultValues: {
            fullName: profile.fullName || profile.username,
            username: profile.username,
            handle: profile.handle,
            email: profile.email || '',
            phone: profile.phone || '',
            bio: profile.bio,
            state: profile.state || '',
            language: profile.language || 'English',
        },
    })

    const [profileSaveError, setProfileSaveError] = useState('')
    const [profileSaving, setProfileSaving] = useState(false)
    const [validationErrors, setValidationErrors] = useState({})

    // Delete Account State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deletePassword, setDeletePassword] = useState('')
    const [deleteError, setDeleteError] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const deleteAccount = useUserStore(state => state.deleteAccount)

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteError("Password is required");
            return;
        }
        setDeleteError('');
        setIsDeleting(true);
        try {
            await deleteAccount(deletePassword);
            navigate('/signin');
        } catch (err) {
            setDeleteError(err?.message || "Failed to delete account");
            setIsDeleting(false);
        }
    };

    const onEdit = async (data) => {
        setProfileSaveError('')
        setProfileSaving(true)
        try {
            await updateProfile({
                name: data.username, // From the modal 'Display Name' input
                bio: data.bio,
                ...(editAvatarFile ? { avatarFile: editAvatarFile } : {}),
            })
            if (typeof loadPosts === 'function') await loadPosts()
            setEditAvatar(null)
            setEditAvatarFile(null)
            setEditOpen(false)
            resetEditForm() // Clear form state
        } catch (err) {
            console.error("[Profile] Edit error:", err);
            setProfileSaveError(err?.message || 'Failed to save profile')
        } finally {
            setProfileSaving(false)
        }
    }

    const onSavePersonalInfo = async (data) => {
        setProfileSaveError('')
        const errors = {}

        // Full Name validation
        if (!data.fullName?.trim()) {
            errors.fullName = 'Full Name is required.'
        }

        // Username validation
        if (!data.username?.trim()) {
            errors.username = 'User Name is required.'
        }

        // Handle validation
        if (!data.handle?.trim()) {
            errors.handle = 'Handle is required.'
        } else {
            const handleVal = data.handle.trim()
            const cleanHandle = handleVal.startsWith('@') ? handleVal.slice(1) : handleVal
            if (cleanHandle.length < 3) {
                errors.handle = 'Handle must be at least 3 characters long.'
            } else if (!/^[a-zA-Z0-9_]+$/.test(cleanHandle)) {
                errors.handle = 'Handle can only contain alphanumeric characters and underscores.'
            }
        }

        // Email validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!data.email?.trim()) {
            errors.email = 'Email is required.'
        } else if (!emailRegex.test(data.email.trim())) {
            errors.email = 'Please enter a valid email address.'
        }

        // Phone validation
        if (data.phone) {
            const phoneRegex = /^\+?[0-9\s-()]+$/
            if (!phoneRegex.test(data.phone)) {
                errors.phone = 'Phone number must contain only digits.'
            } else {
                const cleanPhone = data.phone.replace(/\D/g, '')
                if (cleanPhone.length < 6 || cleanPhone.length > 15) {
                    errors.phone = 'Phone number must be between 6 and 15 digits.'
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors)
            return
        }
        setValidationErrors({})
        setProfileSaving(true)
        try {
            await updateProfile({
                name: data.fullName, // Priority name in Settings
                username: data.username,
                handle: data.handle?.startsWith('@') ? data.handle : `@${data.handle || ''}`,
                email: data.email,
                phone: data.phone,
                bio: data.bio,
                state: data.state,
                language: data.language,
            })
            // Reset both forms to sync new values
            settingsForm.reset(data)
            resetEditForm({ username: data.fullName || data.username, bio: data.bio })
            
            setSettingsOpen(false)
            setSettingsMode('menu')
        } catch (err) {
            console.error("[Profile] Settings error:", err);
            setProfileSaveError(err?.message || 'Failed to save settings')
        } finally {
            setProfileSaving(false)
        }
    }

    useEffect(() => {
        if (!settingsOpen) {
            setValidationErrors({})
            setProfileSaveError('')
        }
    }, [settingsOpen])

    const [passwordChanging, setPasswordChanging] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    }

    const onChangePassword = async () => {
        if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
            setPasswordMsg('Please fill all password fields.')
            return
        }
        if (passwordForm.next !== passwordForm.confirm) {
            setPasswordMsg('New password and confirm password do not match.')
            return
        }
        setPasswordChanging(true);
        setPasswordMsg('');
        try {
            const res = await authService.changePassword(passwordForm.current, passwordForm.next);
            setPasswordMsg(res.message || 'Password changed successfully.');
            setPasswordForm({ current: '', next: '', confirm: '' });
            setShowPasswords({ current: false, next: false, confirm: false });
        } catch (error) {
            setPasswordMsg(error.message || 'Failed to change password.');
        } finally {
            setPasswordChanging(false);
        }
    }

    useEffect(() => {
        settingsForm.reset({
            fullName: profile.fullName || profile.username,
            username: profile.username,
            handle: profile.handle,
            email: profile.email || '',
            phone: profile.phone || '',
            bio: profile.bio,
            state: profile.state || '',
            language: profile.language || 'English',
        })
    }, [profile.id, profile.email, profile.fullName, profile.username, profile.handle, profile.phone, profile.bio, profile.state, profile.language])
    useEffect(() => {
        if (!editOpen) return
        resetEditForm({ username: profile.username, bio: profile.bio })
    }, [editOpen, profile.username, profile.bio, resetEditForm])

    useEffect(() => { loadPosts() }, [loadPosts])
    useEffect(() => { loadWallet() }, [loadWallet])

    const closeEdit = () => {
        setEditOpen(false)
        if (editAvatar && typeof editAvatar === 'string' && editAvatar.startsWith('blob:')) {
            URL.revokeObjectURL(editAvatar)
        }
        setEditAvatar(null)
        setEditAvatarFile(null)
    }

    // NFT sync no longer needed from LocalStorage

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

        const onFollowChanged = () => load()
        window.addEventListener('user-follow-changed', onFollowChanged)

        return () => {
            cancelled = true
            window.removeEventListener('user-follow-changed', onFollowChanged)
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
        const key = 'KnQ Reels_screen_time_start_v1'
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
            <Stories hideFeed={true} />
            <ProfileHeader
                profile={{ 
                    ...profile, 
                    posts: profilePosts.length, 
                    nfts: nftListings.length,
                    followers: followers.length, 
                    following: following.length,
                    totalEarnings: earningsWallet,
                    totalViews
                }}
                onEdit={() => setEditOpen(true)}
                onOpenFollowers={() => setConnectionsOpen('followers')}
                onOpenFollowing={() => setConnectionsOpen('following')}
                onAvatarClick={() => setShowAvatarActionSheet(true)}
            />

            <AnimatePresence>
                {showAvatarActionSheet && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
                        onClick={() => setShowAvatarActionSheet(false)}
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="w-full max-w-sm rounded-3xl p-6 text-center border shadow-2xl flex flex-col gap-3"
                            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="font-bold text-base mb-2" style={{ color: 'var(--color-text)' }}>Profile Options</h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAvatarActionSheet(false);
                                    navigate('?addStory=true', { replace: true });
                                }}
                                className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold text-sm active:scale-95 transition-transform"
                            >
                                Add Story
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAvatarActionSheet(false);
                                    setEditOpen(true);
                                }}
                                className="w-full py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
                                style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                            >
                                Change Profile Picture
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAvatarActionSheet(false)}
                                className="w-full py-3 rounded-xl font-bold text-sm text-zinc-400 active:scale-95 transition-transform mt-2"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-end gap-2 px-4 mb-3">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        setSettingsMode('menu')
                        setSettingsOpen(true)
                    }}
                    className="flex items-center justify-center p-2 rounded-full cursor-pointer"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                    <Settings size={15} />
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleDarkMode}
                    className="flex items-center justify-center p-2 rounded-full cursor-pointer"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                    {darkMode ? <Sun size={15} /> : <Moon size={15} />}
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
                        profilePosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center text-muted">
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>No post available yet</p>
                            </div>
                        ) : (
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
                                                src={optimizeCloudinaryUrl(post.media?.url || post.thumbnail, { isVideo: true, width: 480, quality: '50' })}
                                                muted
                                                playsInline
                                                preload="auto"
                                                poster={post.media?.thumbnail || post.thumbnail ? optimizeCloudinaryUrl(post.media.thumbnail || post.thumbnail, { width: 480, quality: '50' }) : `${optimizeCloudinaryUrl(post.media?.url || post.thumbnail)}#t=0.1`}
                                                className="w-full h-full object-cover bg-black/10"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                                                        <Play size={22} className="text-white" fill="white" />
                                                    </div>
                                                </div>
                                            </>
                                        ) : post.media?.type === 'audio' ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--color-surface2)] text-[var(--color-primary)]">
                                                <Music size={32} />
                                            </div>
                                        ) : (
                                            <img src={optimizeCloudinaryUrl(post.media?.url || post.thumbnail, { width: 480, quality: '50' })} alt="post" className="w-full h-full object-cover" loading="lazy" />
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 p-1.5 flex items-center justify-between pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }}>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-0.5">
                                                    <Eye size={12} className="text-white fill-current opacity-90" />
                                                    <span className="text-[10px] font-black text-white drop-shadow-md">{formatCount(post.views || 0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1 right-1">
                                            <span className="text-[9px] font-bold px-1 py-0.5 rounded-sm" style={{ background: 'rgba(245,158,11,0.9)', color: '#fff' }}>₹{post.earnings ?? 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {activeTab === 'NFTs' && (
                        <div className="px-4 py-3 flex flex-col gap-3">
                            {nftListings.length === 0 && (
                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No NFTs listed yet.</p>
                            )}
                            {nftListings.map((nft) => (
                                <div key={nft.id} onClick={() => setActivePostIndex(nftListings.findIndex((item) => String(item.id) === String(nft.id)))} className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--color-surface2)' }}>
                                        {nft.media?.type === 'video' || nft.mediaType === 'video' ? (
                                            <video
                                                src={nft.media?.url || nft.mediaUrl}
                                                poster={nft.thumbnail || nft.media?.thumbnail || undefined}
                                                muted
                                                autoPlay
                                                loop
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />
                                        ) : nft.media?.type === 'audio' || nft.mediaType === 'audio' ? (
                                            <div className="w-full h-full flex items-center justify-center text-[var(--color-primary)]">
                                                <Music size={24} />
                                            </div>
                                        ) : (
                                            <img
                                                src={nft.media?.url || nft.mediaUrl || nft.thumbnail || nft.media?.thumbnail}
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
                posts={settingsTab === 'Saved Posts' && settingsOpen ? savedPosts : activeTab === 'NFTs' ? nftListings : profilePosts} 
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
                                        <img 
                                            src={editAvatar || profile.avatar || '/person.png'} 
                                            alt={profile.username} 
                                            className={`w-full h-full object-cover ${(!editAvatar && !profile.avatar) ? 'opacity-60' : ''}`} 
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (typeof window.flutter_inappwebview !== 'undefined') {
                                                setShowAvatarSourcePicker(true);
                                            } else {
                                                fileInputRef.current?.click();
                                            }
                                        }}
                                        className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border-none outline-none"
                                        style={{ background: 'var(--color-primary)', color: '#fff' }}
                                    >
                                        Change Profile Photo
                                    </button>
                                    <input
                                        ref={fileInputRef}
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
                                </div>

                                <AnimatePresence>
                                    {showAvatarSourcePicker && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-[110] bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
                                            onClick={() => setShowAvatarSourcePicker(false)}
                                        >
                                            <motion.div
                                                initial={{ y: 50, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: 50, opacity: 0 }}
                                                className="w-full max-w-sm rounded-3xl p-6 text-center border shadow-2xl flex flex-col gap-3"
                                                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <h3 className="font-bold text-base mb-2" style={{ color: 'var(--color-text)' }}>Select Photo Source</h3>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        setShowAvatarSourcePicker(false);
                                                        try {
                                                            const result = await window.flutter_inappwebview.callHandler('openCamera');
                                                            if (result && result.success && result.base64) {
                                                                const byteCharacters = atob(result.base64);
                                                                const byteNumbers = new Array(byteCharacters.length);
                                                                for (let i = 0; i < byteCharacters.length; i++) {
                                                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                                                }
                                                                const byteArray = new Uint8Array(byteNumbers);
                                                                const blob = new Blob([byteArray], { type: result.mimeType || 'image/jpeg' });
                                                                const file = new File([blob], result.fileName || 'camera-photo.jpg', { type: result.mimeType || 'image/jpeg' });
                                                                
                                                                if (editAvatar && editAvatar.startsWith('blob:')) {
                                                                    URL.revokeObjectURL(editAvatar);
                                                                }
                                                                setEditAvatarFile(file);
                                                                setEditAvatar(URL.createObjectURL(file));
                                                            }
                                                        } catch (err) {
                                                            console.error('Flutter camera picker error:', err);
                                                        }
                                                    }}
                                                    className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold text-sm active:scale-95 transition-transform"
                                                >
                                                    Take Photo (Camera)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowAvatarSourcePicker(false);
                                                        fileInputRef.current?.click();
                                                    }}
                                                    className="w-full py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
                                                    style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                                >
                                                    Choose from Library (Files)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAvatarSourcePicker(false)}
                                                    className="w-full py-3 rounded-xl font-bold text-sm text-zinc-400 active:scale-95 transition-transform mt-2"
                                                >
                                                    Cancel
                                                </button>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
                                    <div 
                                        key={item.id} 
                                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--color-surface)] transition-colors" 
                                        style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
                                        onClick={() => {
                                            setConnectionsOpen(null);
                                            navigate(`/user/${item.id}`);
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'var(--color-primary)' }}>
                                            {item.avatar ? (
                                                <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                item.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{item.name}</p>
                                            <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{item.email || item.handle}</p>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConnectionsOpen(null);
                                                navigate('/messaging', { state: { openChat: { id: item.id, username: item.name, handle: item.handle, avatar: item.avatar } } });
                                            }}
                                            className="p-2 rounded-lg hover:bg-[var(--color-surface2)] transition-colors shrink-0"
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
                                    {settingsMode === 'menu' && (
                                        <button onClick={() => setSettingsOpen(false)}><X size={18} style={{ color: 'var(--color-muted)' }} /></button>
                                    )}
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
                                                    {section === 'Content Languages' && <Globe size={15} style={{ color: 'var(--color-primary)' }} />}
                                                    {section === 'KYC Details' && <Shield size={15} style={{ color: 'var(--color-primary)' }} />}
                                                    {section === 'Personal Information' && <FileText size={15} style={{ color: 'var(--color-primary)' }} />}
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
                                                                    src={optimizeCloudinaryUrl(post.media?.url, { isVideo: true, width: 480, quality: '50' })}
                                                                    muted
                                                                    playsInline
                                                                    preload="metadata"
                                                                    poster={optimizeCloudinaryUrl(post.media?.thumbnail || post.media?.poster, { width: 480, quality: '50' })}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                    <Play size={20} className="text-white opacity-90" fill="white" />
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <img src={optimizeCloudinaryUrl(post.media?.url, { width: 480, quality: '50' })} alt="saved post" className="w-full h-full object-cover" loading="lazy" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {settingsMode === 'detail' && settingsTab === 'KYC Details' && (
                                    <div className="space-y-4 text-[var(--color-text)]">
                                        {kycLoading ? (
                                            <div className="flex justify-center py-8">
                                                <Clock3 className="animate-spin text-[var(--color-primary)]" size={24} />
                                            </div>
                                        ) : !kycDetails ? (
                                            <div className="text-center py-6">
                                                <Shield className="mx-auto text-[var(--color-muted)] mb-2" size={32} />
                                                <p className="text-sm font-semibold">No KYC submission found</p>
                                                <p className="text-xs text-[var(--color-muted)] mt-1">Please submit your KYC documents via the Wallet page to verify your account.</p>
                                                <button 
                                                    onClick={() => {
                                                        setSettingsOpen(false);
                                                        navigate('/wallet');
                                                    }}
                                                    className="mt-4 px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all"
                                                >
                                                    Go to Wallet
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)]" style={{ background: 'var(--color-surface2)' }}>
                                                    <span className="text-xs font-semibold text-[var(--color-muted)]">Verification Status</span>
                                                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${
                                                        kycDetails.status === 'verified' 
                                                            ? 'bg-emerald-500/10 text-emerald-500' 
                                                            : kycDetails.status === 'rejected'
                                                            ? 'bg-red-500/10 text-red-500'
                                                            : 'bg-amber-500/10 text-amber-500'
                                                    }`}>
                                                        {kycDetails.status}
                                                    </span>
                                                </div>

                                                {kycDetails.rejectionReason && (
                                                    <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400">
                                                        <span className="font-semibold block mb-0.5">Rejection Reason:</span>
                                                        {kycDetails.rejectionReason}
                                                    </div>
                                                )}

                                                <div className="space-y-2.5">
                                                    <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                                                        <span className="text-xs text-[var(--color-muted)]">Aadhar Number</span>
                                                        <span className="text-xs font-bold font-mono">
                                                            {kycDetails.aadharNumber ? `XXXX XXXX ${kycDetails.aadharNumber.slice(-4)}` : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                                                        <span className="text-xs text-[var(--color-muted)]">PAN Number</span>
                                                        <span className="text-xs font-bold font-mono">
                                                            {kycDetails.panNumber ? `${kycDetails.panNumber.slice(0, 3)}XXXX${kycDetails.panNumber.slice(-3)}`.toUpperCase() : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wide">Submitted Documents</p>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {kycDetails.documents?.aadharFrontUrl && (
                                                            <div className="space-y-1">
                                                                <span className="text-[11px] font-semibold text-[var(--color-muted)]">Aadhar Card Front</span>
                                                                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-black/5">
                                                                    <img 
                                                                        src={optimizeCloudinaryUrl(kycDetails.documents.aadharFrontUrl)} 
                                                                        alt="Aadhar Front"
                                                                        className="h-full w-full object-contain cursor-zoom-in hover:scale-105 transition-transform duration-300"
                                                                        onClick={() => window.open(optimizeCloudinaryUrl(kycDetails.documents.aadharFrontUrl), '_blank')}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {kycDetails.documents?.aadharBackUrl && (
                                                            <div className="space-y-1">
                                                                <span className="text-[11px] font-semibold text-[var(--color-muted)]">Aadhar Card Back</span>
                                                                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-black/5">
                                                                    <img 
                                                                        src={optimizeCloudinaryUrl(kycDetails.documents.aadharBackUrl)} 
                                                                        alt="Aadhar Back"
                                                                        className="h-full w-full object-contain cursor-zoom-in hover:scale-105 transition-transform duration-300"
                                                                        onClick={() => window.open(optimizeCloudinaryUrl(kycDetails.documents.aadharBackUrl), '_blank')}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {kycDetails.documents?.panCardUrl && (
                                                            <div className="space-y-1">
                                                                <span className="text-[11px] font-semibold text-[var(--color-muted)]">PAN Card</span>
                                                                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-black/5">
                                                                    <img 
                                                                        src={optimizeCloudinaryUrl(kycDetails.documents.panCardUrl)} 
                                                                        alt="PAN Card"
                                                                        className="h-full w-full object-contain cursor-zoom-in hover:scale-105 transition-transform duration-300"
                                                                        onClick={() => window.open(optimizeCloudinaryUrl(kycDetails.documents.panCardUrl), '_blank')}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {settingsMode === 'detail' && settingsTab === 'Personal Information' && (
                                     <form onSubmit={settingsForm.handleSubmit(onSavePersonalInfo)} className="space-y-3">
                                         {profileSaveError && <p className="text-xs text-red-500">{profileSaveError}</p>}
                                         
                                         <div>
                                             <input {...settingsForm.register('fullName')} placeholder="Full Name" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: validationErrors.fullName ? '1px solid var(--color-danger)' : '1px solid var(--color-border)' }} />
                                             {validationErrors.fullName && <p className="text-[10px] text-red-500 mt-1 ml-1">{validationErrors.fullName}</p>}
                                         </div>

                                         <div>
                                             <input {...settingsForm.register('username')} placeholder="User Name" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: validationErrors.username ? '1px solid var(--color-danger)' : '1px solid var(--color-border)' }} />
                                             {validationErrors.username && <p className="text-[10px] text-red-500 mt-1 ml-1">{validationErrors.username}</p>}
                                         </div>

                                         <div>
                                             <input {...settingsForm.register('handle')} placeholder="@handle" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: validationErrors.handle ? '1px solid var(--color-danger)' : '1px solid var(--color-border)' }} />
                                             {validationErrors.handle && <p className="text-[10px] text-red-500 mt-1 ml-1">{validationErrors.handle}</p>}
                                         </div>

                                         <div>
                                             <input {...settingsForm.register('email')} placeholder="Email" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: validationErrors.email ? '1px solid var(--color-danger)' : '1px solid var(--color-border)' }} />
                                             {validationErrors.email && <p className="text-[10px] text-red-500 mt-1 ml-1">{validationErrors.email}</p>}
                                         </div>

                                         <div>
                                             <input {...settingsForm.register('phone')} placeholder="Phone Number" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: validationErrors.phone ? '1px solid var(--color-danger)' : '1px solid var(--color-border)' }} />
                                             {validationErrors.phone && <p className="text-[10px] text-red-500 mt-1 ml-1">{validationErrors.phone}</p>}
                                         </div>

                                        {/* Read-only Country & Currency — set during registration, cannot be changed */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="relative">
                                                <div className="w-full px-3 py-2 rounded-lg text-sm flex items-center gap-2 select-none cursor-not-allowed" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)', opacity: 0.65 }}>
                                                    <span className="text-base">{profile.flag || '🌍'}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Country</p>
                                                        <p className="font-semibold truncate">
                                                            {profile.countryName || profile.country || profile.countryCode || 'Unknown'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <div className="w-full px-3 py-2 rounded-lg text-sm flex items-center gap-2 select-none cursor-not-allowed" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)', opacity: 0.65 }}>
                                                    <span className="text-base font-black" style={{ color: 'var(--color-primary)' }}>{profile.currencySymbol || '$'}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Currency</p>
                                                        <p className="font-semibold truncate">{profile.currencyCode || profile.countryCode || '—'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-medium -mt-1 ml-1" style={{ color: 'var(--color-muted)' }}>
                                            🔒 Country &amp; currency are set at registration and cannot be changed.
                                        </p>

                                        <input {...settingsForm.register('state')} placeholder="State / Province" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                                        <select {...settingsForm.register('language')} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                                            {["English", "Hindi", "Gujarati", "Marathi", "Bengali", "Telugu", "Tamil", "Kannada", "Malayalam"].map(l => (
                                                <option key={l} value={l}>{l}</option>
                                            ))}
                                        </select>
                                        <textarea {...settingsForm.register('bio')} rows={3} placeholder="Bio" className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                                        <button type="submit" disabled={profileSaving} className="w-full py-2.5 rounded-lg text-sm font-bold disabled:opacity-50" style={{ background: 'var(--color-primary)', color: '#fff' }}>{profileSaving ? 'Saving...' : 'Save Personal Information'}</button>
                                    </form>
                                )}
                                
                                {settingsMode === 'detail' && settingsTab === 'Content Languages' && (
                                    <div className="space-y-4">
                                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                            Select the languages you prefer to watch content in. We will prioritize showing posts in these languages.
                                        </p>
                                        
                                        {profileSaveError && <p className="text-xs text-red-500">{profileSaveError}</p>}

                                        <div className="grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
                                            {["English", "Hindi", "Gujarati", "Marathi", "Bengali", "Telugu", "Tamil", "Kannada", "Malayalam"].map((lang) => {
                                                const isChecked = selectedLangs.includes(lang);
                                                return (
                                                    <button
                                                        key={lang}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedLangs(prev => 
                                                                prev.includes(lang) 
                                                                    ? prev.filter(l => l !== lang) 
                                                                    : [...prev, lang]
                                                            );
                                                        }}
                                                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left"
                                                        style={{ 
                                                            background: isChecked ? 'rgba(77,112,255,0.08)' : 'var(--color-surface2)', 
                                                            color: isChecked ? 'var(--color-primary)' : 'var(--color-text)', 
                                                            borderColor: isChecked ? 'var(--color-primary)' : 'var(--color-border)' 
                                                        }}
                                                    >
                                                        <span>{lang}</span>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isChecked} 
                                                            readOnly 
                                                            className="accent-[var(--color-primary)] w-3.5 h-3.5 cursor-pointer pointer-events-none"
                                                        />
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button 
                                            type="button" 
                                            disabled={profileSaving}
                                            onClick={async () => {
                                                setProfileSaveError('');
                                                setProfileSaving(true);
                                                try {
                                                    await updateProfile({
                                                        languages: selectedLangs,
                                                        hasSelectedLanguages: selectedLangs.length > 0
                                                    });
                                                    setSettingsOpen(false);
                                                    setSettingsMode('menu');
                                                } catch (err) {
                                                    console.error("Failed to save content languages:", err);
                                                    setProfileSaveError(err?.message || 'Failed to save languages');
                                                } finally {
                                                    setProfileSaving(false);
                                                }
                                            }}
                                            className="w-full py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 mt-4 shadow-lg active:scale-95 transition-transform" 
                                            style={{ background: 'var(--color-primary)', color: '#fff' }}
                                        >
                                            {profileSaving ? 'Saving...' : 'Save Content Languages'}
                                        </button>
                                    </div>
                                )}
                                {settingsMode === 'detail' && settingsTab === 'Change Password' && (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <input type={showPasswords.current ? "text" : "password"} value={passwordForm.current} onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))} placeholder="Current Password" className="w-full pl-3 pr-10 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} disabled={passwordChanging} />
                                            <button type="button" onClick={() => togglePasswordVisibility('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                                {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input type={showPasswords.next ? "text" : "password"} value={passwordForm.next} onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))} placeholder="New Password" className="w-full pl-3 pr-10 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} disabled={passwordChanging} />
                                            <button type="button" onClick={() => togglePasswordVisibility('next')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                                {showPasswords.next ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input type={showPasswords.confirm ? "text" : "password"} value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} placeholder="Confirm New Password" className="w-full pl-3 pr-10 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} disabled={passwordChanging} />
                                            <button type="button" onClick={() => togglePasswordVisibility('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                                {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        <button onClick={onChangePassword} disabled={passwordChanging} className="w-full py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 mt-2" style={{ background: 'var(--color-primary)', color: '#fff' }}>{passwordChanging ? 'Updating...' : 'Update Password'}</button>
                                        {passwordMsg && <p className="text-xs font-semibold mt-1" style={{ color: passwordMsg.includes('success') ? 'var(--color-primary)' : 'var(--color-danger)' }}>{passwordMsg}</p>}
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
                                        <button onClick={() => { setSettingsOpen(false); navigate('/terms-conditions', { state: { openSettingsOnBack: { openSettings: true, settingsMode: 'detail', settingsTab: 'Terms & Policies' } } }) }} className="w-full p-3 rounded-lg flex items-center gap-2 text-left" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}><FileText size={14} style={{ color: 'var(--color-primary)' }} /><p className="text-sm" style={{ color: 'var(--color-text)' }}>Terms & Conditions</p></button>
                                        <button onClick={() => { setSettingsOpen(false); navigate('/privacy-policy', { state: { openSettingsOnBack: { openSettings: true, settingsMode: 'detail', settingsTab: 'Terms & Policies' } } }) }} className="w-full p-3 rounded-lg flex items-center gap-2 text-left" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}><Shield size={14} style={{ color: 'var(--color-primary)' }} /><p className="text-sm" style={{ color: 'var(--color-text)' }}>Privacy Policy</p></button>
                                        <button onClick={() => { setSettingsOpen(false); navigate('/guidelines', { state: { openSettingsOnBack: { openSettings: true, settingsMode: 'detail', settingsTab: 'Terms & Policies' } } }) }} className="w-full p-3 rounded-lg flex items-center gap-2 text-left" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}><FileText size={14} style={{ color: 'var(--color-primary)' }} /><p className="text-sm" style={{ color: 'var(--color-text)' }}>Community Guidelines</p></button>
                                    </div>
                                )}
                                {settingsMode === 'detail' && settingsTab === 'Contacts' && (
                                    <div className="space-y-2">
                                        <button onClick={() => { setSettingsOpen(false); navigate('/support', { state: { openSettingsOnBack: { openSettings: true, settingsMode: 'detail', settingsTab: 'Contacts' } } }) }} className="w-full p-3 rounded-lg flex items-center gap-2 text-left cursor-pointer" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
                                            <Phone size={14} style={{ color: 'var(--color-primary)' }} />
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Support Page</p>
                                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Get help and submit tickets</p>
                                            </div>
                                        </button>
                                    </div>
                                )}
                                {settingsMode === 'menu' && (
                                    <div className="pt-5 mt-5 border-t flex flex-col items-center gap-3" style={{ borderColor: 'var(--color-border)' }}>
                                        <button onClick={() => setIsLogoutModalOpen(true)} className="w-full max-w-[200px] py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(244,63,94,0.14)', color: 'var(--color-danger)', border: '1px solid rgba(244,63,94,0.25)' }}>
                                            Logout
                                        </button>
                                        <button onClick={() => setIsDeleteModalOpen(true)} className="w-full max-w-[200px] py-1.5 rounded-lg text-xs font-bold" style={{ background: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}>
                                            Delete Account
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <LogoutConfirmationModal 
                isOpen={isLogoutModalOpen} 
                onClose={() => setIsLogoutModalOpen(false)} 
                onConfirm={async () => {
                    setIsLogoutModalOpen(false)
                    useUserStore.getState().logout()
                    try { await privyLogout(); } catch(e) {}
                    window.location.href = '/signin'
                }}
            />
            <DeleteAccountConfirmationModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => {
                    setIsDeleteModalOpen(false)
                    setDeleteError('')
                    setDeletePassword('')
                }} 
                onConfirm={handleDeleteAccount}
                password={deletePassword}
                setPassword={setDeletePassword}
                error={deleteError}
                isDeleting={isDeleting}
            />
        </div>
    )
}

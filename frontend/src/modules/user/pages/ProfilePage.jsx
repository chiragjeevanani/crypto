import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { X, Moon, Sun } from 'lucide-react'
import { useUserStore } from '../store/useUserStore'
import { useWalletStore } from '../store/useWalletStore'
import ProfileHeader from '../components/profile/ProfileHeader'
import NFTBadge from '../components/shared/NFTBadge'
import { mockNFTs, mockProfilePosts } from '../data/mockNFTs'
import { mockTasks } from '../data/mockTasks'

const TABS = ['Posts', 'NFTs', 'Tasks']

export default function ProfilePage() {
    const { profile, updateProfile, toggleDarkMode, darkMode } = useUserStore()
    const { giftEarnings, taskEarnings, nftEarnings } = useWalletStore()
    const [activeTab, setActiveTab] = useState('Posts')
    const [editOpen, setEditOpen] = useState(false)
    const { register, handleSubmit } = useForm({ defaultValues: { username: profile.username, bio: profile.bio } })

    const onEdit = (data) => {
        updateProfile(data)
        setEditOpen(false)
    }

    return (
        <div>
            {/* Profile header */}
            <ProfileHeader profile={profile} onEdit={() => setEditOpen(true)} />

            {/* Dark mode toggle + Logout row */}
            <div className="flex items-center justify-end gap-2 px-4 mb-3">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleDarkMode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                    {darkMode ? <Sun size={13} /> : <Moon size={13} />}
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        useUserStore.getState().logout();
                        window.location.href = '/login';
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer text-rose-500"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                    Logout
                </motion.button>
            </div>

            {/* Tabs */}
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
                            {active && (
                                <motion.div
                                    layoutId="profile-tab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                    style={{ background: 'var(--color-primary)' }}
                                />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* Posts grid */}
                    {activeTab === 'Posts' && (
                        <div className="grid grid-cols-3 gap-0.5 p-0.5">
                            {mockProfilePosts.map((post) => (
                                <div key={post.id} className="relative" style={{ aspectRatio: '1' }}>
                                    <img
                                        src={post.thumbnail}
                                        alt="post"
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute bottom-1 right-1">
                                        <span
                                            className="text-[9px] font-bold px-1 py-0.5 rounded-sm"
                                            style={{ background: 'rgba(245,158,11,0.9)', color: '#fff' }}
                                        >
                                            ₹{post.earnings}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* NFTs */}
                    {activeTab === 'NFTs' && (
                        <div className="px-4 py-3 flex flex-col gap-3">
                            {mockNFTs.map((nft) => (
                                <div
                                    key={nft.id}
                                    className="flex items-center gap-3 p-3 rounded-2xl"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                >
                                    <img
                                        src={nft.thumbnail}
                                        alt={nft.title}
                                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                            {nft.title}
                                        </p>
                                        <NFTBadge status={nft.status} price={nft.price} className="mt-1" />
                                        <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
                                            {nft.views} views · {nft.bids} bids
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tasks won */}
                    {activeTab === 'Tasks' && (
                        <div className="px-4 py-3 flex flex-col gap-3">
                            {mockTasks.filter((t) => t.joined).map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-3 p-3 rounded-2xl"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                        style={{ background: '#FF3F6C' }}
                                    >
                                        {task.brand.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                            {task.title}
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                                            {task.brand.name}
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold" style={{ color: 'var(--color-success)' }}>
                                        +₹{task.myReward}
                                    </span>
                                </div>
                            ))}
                            {mockTasks.filter((t) => t.joined).length === 0 && (
                                <p className="text-sm text-center py-8" style={{ color: 'var(--color-muted)' }}>
                                    No tasks completed yet
                                </p>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Edit Profile bottom sheet */}
            <AnimatePresence>
                {editOpen && (
                    <motion.div
                        className="fixed inset-0 z-40 flex flex-col justify-end"
                        style={{ background: 'rgba(0,0,0,0.6)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setEditOpen(false)}
                    >
                        <motion.div
                            className="rounded-t-3xl px-5 pt-4 pb-8"
                            style={{ background: 'var(--color-surface)' }}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Handle */}
                            <div className="flex justify-center mb-4">
                                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Edit Profile</p>
                                <button onClick={() => setEditOpen(false)} className="cursor-pointer">
                                    <X size={18} style={{ color: 'var(--color-muted)' }} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onEdit)} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sub)' }}>
                                        Display Name
                                    </label>
                                    <input
                                        {...register('username')}
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                        style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sub)' }}>
                                        Bio
                                    </label>
                                    <textarea
                                        {...register('bio')}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                                        style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                    />
                                </div>
                                <motion.button
                                    type="submit"
                                    whileTap={{ scale: 0.96 }}
                                    className="w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer"
                                    style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))', color: '#fff' }}
                                >
                                    Save Changes
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

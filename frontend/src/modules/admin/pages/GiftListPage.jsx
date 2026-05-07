import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminPageHeader } from '../components/shared'
import { useAdminStore } from '../store/useAdminStore'

export default function GiftListPage() {
    const navigate = useNavigate()
    const { gifts, loadGifts, updateGift, removeGift, toggleGiftStatus, isLoading, giftPolicy } = useAdminStore()
    const [editingGift, setEditingGift] = useState(null)
    const [formData, setFormData] = useState({ name: '', priceInr: 0, priceGlobal: 0, icon: '🎁', status: 'Active', soundUrl: '', soundFile: null })

    useEffect(() => {
        loadGifts()
    }, [loadGifts])

    const openEdit = (gift) => {
        setEditingGift(gift)
        setFormData({
            name: gift.name,
            priceInr: Number(gift.priceInr || gift.price || 0),
            priceGlobal: Number(gift.priceGlobal || 0),
            icon: gift.icon || '🎁',
            status: gift.status || 'Active',
            soundUrl: gift.soundUrl || '',
        })
    }

    const saveEdit = async (event) => {
        event.preventDefault()
        if (!editingGift) return
        
        const submissionData = new FormData();
        submissionData.append('name', formData.name);
        submissionData.append('priceInr', formData.priceInr);
        submissionData.append('priceGlobal', formData.priceGlobal);
        submissionData.append('icon', formData.icon);
        submissionData.append('status', formData.status);
        if (formData.soundUrl) submissionData.append('soundUrl', formData.soundUrl);
        if (formData.soundFile) submissionData.append('sound', formData.soundFile);

        await updateGift(editingGift.id, submissionData)
        setEditingGift(null)
    }

    return (
        <div className="space-y-8 pb-20">
            <AdminPageHeader
                title="Gift List"
                subtitle="Manage regional and global gift pricing and asset distribution."
                actions={
                    <button
                        onClick={() => navigate('/admin/gifts/create')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-black"
                    >
                        <Plus className="w-4 h-4" />
                        Add Gift
                    </button>
                }
            />

            <div className="rounded-2xl border border-surface bg-surface p-5">
                <p className="text-xs font-semibold text-muted mb-4">
                    Price policy: ₹{giftPolicy.allowedINR.join(', ₹')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {gifts.map((gift) => (
                        <div key={gift.id} className="rounded-xl border border-surface bg-bg p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-surface2 flex items-center justify-center text-xl">
                                        {gift.icon || '🎁'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-text">{gift.name}</p>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted font-bold">INR: ₹{gift.priceInr || gift.price}</span>
                                            <span className="text-[10px] text-indigo-500 font-bold">Global: {gift.priceGlobal || 0}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleGiftStatus(gift.id)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${gift.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface2 text-muted'}`}
                                >
                                    {gift.status}
                                </button>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-muted">
                                <span>Usage: {gift.usage || 0}</span>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    onClick={() => openEdit(gift)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface2 text-xs font-semibold text-text"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => removeGift(gift.id)}
                                    className="px-3 py-2 rounded-lg bg-rose-500/10 text-rose-500"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {editingGift && (
                    <motion.div
                        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.form
                            onSubmit={saveEdit}
                            className="w-full max-w-md rounded-2xl border border-surface bg-surface p-5"
                            initial={{ scale: 0.98, y: 10, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.98, y: 10, opacity: 0 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-semibold text-text">Edit Gift</p>
                                <button type="button" onClick={() => setEditingGift(null)} className="text-muted">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full rounded-lg border border-surface bg-bg px-3 py-2 text-sm text-text outline-none"
                                    placeholder="Gift name"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest ml-1">Price (INR ₹)</p>
                                        <input
                                            type="number"
                                            value={formData.priceInr}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, priceInr: Number(e.target.value || 0) }))}
                                            className="w-full rounded-lg border border-surface bg-bg px-3 py-2 text-sm text-text outline-none"
                                            placeholder="INR Price"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest ml-1">Price (Global)</p>
                                        <input
                                            type="number"
                                            value={formData.priceGlobal}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, priceGlobal: Number(e.target.value || 0) }))}
                                            className="w-full rounded-lg border border-surface bg-bg px-3 py-2 text-sm text-text outline-none"
                                            placeholder="Global Price"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={formData.icon}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                                        className="w-full rounded-lg border border-surface bg-bg px-3 py-2 text-sm text-text outline-none text-center text-xl"
                                        placeholder="Emoji"
                                    />
                                    <div className="flex flex-wrap gap-1.5 justify-center">
                                        {['❤️', '💎', '🌹', '🔥', '⭐', '🎁', '🍫', '🍬', '🍭', '🍦', '🍩', '🍰', '🥨', '🥂', '👑', '🦄'].map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => setFormData((prev) => ({ ...prev, icon: emoji }))}
                                                className={`w-8 h-8 rounded flex items-center justify-center text-lg border transition-all ${
                                                    formData.icon === emoji
                                                        ? 'bg-primary/20 border-primary'
                                                        : 'bg-bg border-surface hover:border-primary/40'
                                                }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={formData.soundUrl}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, soundUrl: e.target.value }))}
                                    className="w-full rounded-lg border border-surface bg-bg px-3 py-2 text-sm text-text outline-none"
                                    placeholder="Sound URL (Music)"
                                />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Or Upload File</p>
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        onChange={(e) => setFormData((prev) => ({ ...prev, soundFile: e.target.files[0] }))}
                                        className="w-full rounded-lg border border-surface bg-bg px-3 py-2 text-xs text-text outline-none file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[9px] file:font-bold file:bg-primary/20 file:text-primary"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-black disabled:opacity-50"
                            >
                                Save Gift
                            </button>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

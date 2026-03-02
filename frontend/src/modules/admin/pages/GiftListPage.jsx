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
    const [formData, setFormData] = useState({ name: '', price: 2, icon: '🎁', commission: 15, status: 'Active' })

    useEffect(() => {
        loadGifts()
    }, [loadGifts])

    const openEdit = (gift) => {
        setEditingGift(gift)
        setFormData({
            name: gift.name,
            price: Number(gift.price || 2),
            icon: gift.icon || '🎁',
            commission: Number(gift.commission || 15),
            status: gift.status || 'Active',
        })
    }

    const saveEdit = async (event) => {
        event.preventDefault()
        if (!editingGift) return
        const safePrice = Math.max(2, Math.min(10, Math.round(Number(formData.price || 2))))
        await updateGift(editingGift.id, { ...formData, price: safePrice, value: safePrice })
        setEditingGift(null)
    }

    return (
        <div className="space-y-8 pb-20">
            <AdminPageHeader
                title="Gift List"
                subtitle="Manage gift prices. Allowed range is ₹2 to ₹10."
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
                                        <p className="text-xs text-muted">Price: ₹{gift.price}</p>
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
                                <span>Commission: {gift.commission || 0}%</span>
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
                                <input
                                    type="number"
                                    min={2}
                                    max={10}
                                    value={formData.price}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value || 2) }))}
                                    className="w-full rounded-lg border border-surface bg-bg px-3 py-2 text-sm text-text outline-none"
                                    placeholder="Price in ₹ (1 to 10)"
                                />
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                                    className="w-full rounded-lg border border-surface bg-bg px-3 py-2 text-sm text-text outline-none"
                                    placeholder="Emoji"
                                />
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

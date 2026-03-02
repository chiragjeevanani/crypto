import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Gift,
    ArrowLeft,
    Save,
    Sparkles,
    ShieldCheck,
    Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminPageHeader } from '../components/shared';
import { useAdminStore } from '../store/useAdminStore';

export default function CreateGift() {
    const { addGift, giftPolicy, isLoading } = useAdminStore();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        icon: '🎁',
        status: 'Active'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const safePrice = Math.max(2, Math.min(10, Math.round(Number(formData.price || 2))))
            if (giftPolicy.strictMode && !giftPolicy.allowedINR.includes(safePrice)) {
                alert(`Policy violation: allowed gift range is ₹2 to ₹10.`);
                return;
            }
            await addGift({ ...formData, price: safePrice, value: safePrice });
            navigate('/admin/gifts');
        } catch (err) {
            console.error('Failed to initialize asset:', err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            <AdminPageHeader
                title="Initialize Digital Asset"
                subtitle="Deploy new reward tokens and micro-gift protocols to the network."
                actions={
                    <button
                        onClick={() => navigate('/admin/gifts')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Registry
                    </button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface border border-surface rounded-2xl overflow-hidden shadow-xl"
                    >
                        <div className="p-6 border-b border-surface/50 bg-surface2/30">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text flex items-center gap-3">
                                <Sparkles className="w-4 h-4 text-primary" />
                                Asset Configuration
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Asset Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Diamond Heart"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-bg border border-surface rounded-xl p-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 text-text transition-all"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Visual Icon (Emoji)</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="text"
                                            value={formData.icon}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                            className="w-full bg-bg border border-surface rounded-xl p-4 text-center text-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-20">
                                            <Gift className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Gift Price (₹)</label>
                                    <input
                                        required
                                        type="number"
                                        min={2}
                                        max={10}
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-bg border border-surface rounded-xl p-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 text-text transition-all"
                                    />
                                    <p className="text-[9px] text-muted uppercase tracking-wider">
                                        Allowed range: ₹2 to ₹10
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-primary text-black rounded-xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isLoading ? (
                                        <Activity className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Initialize Asset Node
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>

                {/* Preview Section */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <div className="p-6 bg-surface border border-surface rounded-2xl">
                            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted mb-6 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Integrity Preview
                            </h4>

                            <div className="p-8 rounded-2xl bg-bg border border-surface flex flex-col items-center text-center space-y-4">
                                <div className="text-5xl mb-2 filter drop-shadow-lg">
                                    {formData.icon || '🎁'}
                                </div>
                                <div>
                                    <h5 className="text-sm font-bold text-text mb-1 uppercase tracking-wider">{formData.name || 'Unnamed Asset'}</h5>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">₹{formData.price}</p>
                                </div>
                                <div className="w-full pt-4 border-t border-surface/50">
                                    <div>
                                        <p className="text-[8px] font-bold text-muted uppercase mb-1 text-center">Status</p>
                                        <p className="text-xs font-bold text-emerald-500 text-center">Live</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl">
                            <p className="text-[9px] font-medium text-primary/80 leading-relaxed uppercase tracking-wider italic">
                                "All digital assets undergo protocol validation. Once initialized, the asset node will be broadcast to all network clusters for immediate interaction."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

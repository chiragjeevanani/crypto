import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Clock, Save, Info, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { getStoredToken } from '../../user/store/useUserStore';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function PromotionSettingsPage() {
    const [settings, setSettings] = useState({
        minDailyBudget: 99,
        maxDailyBudget: 100000,
        minDuration: 1,
        maxDuration: 30,
        minImpressionFactor: 14,
        maxImpressionFactor: 29
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const getAuthHeaders = () => {
        const token = getStoredToken();
        return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/promotion/settings`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success && data.settings) {
                setSettings(data.settings);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await fetch(`${API_BASE}/admin/promotion/settings`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Settings updated successfully!' });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update settings' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error occurred' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted uppercase font-bold text-xs tracking-widest">Loading Settings...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                        <Target className="text-primary w-8 h-8" />
                        Promotion & Ad Rules
                    </h1>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mt-1">Manage global ad budgets and reach estimates</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary text-black px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                    <Save size={16} />
                    {saving ? 'Updating...' : 'Save Changes'}
                </button>
            </div>

            {message.text && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}
                >
                    {message.type === 'success' ? <TrendingUp size={18} /> : <AlertCircle size={18} />}
                    <span className="text-xs font-bold uppercase tracking-wider">{message.text}</span>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Budget Rules */}
                <div className="bg-surface border border-surface rounded-2xl p-6 space-y-6">
                    <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted">
                        <Target size={16} /> Budget Limits
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Minimum Daily Budget (₹)</label>
                            <input
                                type="number"
                                value={settings.minDailyBudget}
                                onChange={(e) => setSettings({ ...settings, minDailyBudget: Number(e.target.value) })}
                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Maximum Daily Budget (₹)</label>
                            <input
                                type="number"
                                value={settings.maxDailyBudget}
                                onChange={(e) => setSettings({ ...settings, maxDailyBudget: Number(e.target.value) })}
                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Duration Rules */}
                <div className="bg-surface border border-surface rounded-2xl p-6 space-y-6">
                    <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted">
                        <Clock size={16} /> Duration Rules
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Minimum Duration (Days)</label>
                            <input
                                type="number"
                                value={settings.minDuration}
                                onChange={(e) => setSettings({ ...settings, minDuration: Number(e.target.value) })}
                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Maximum Duration (Days)</label>
                            <input
                                type="number"
                                value={settings.maxDuration}
                                onChange={(e) => setSettings({ ...settings, maxDuration: Number(e.target.value) })}
                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Performance Estimation */}
                <div className="bg-surface border border-surface rounded-2xl p-6 md:col-span-2 space-y-6">
                    <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted">
                        <TrendingUp size={16} /> Reach Modeling
                    </h2>
                    
                    <div className="bg-primary/5 rounded-xl p-4 flex gap-4 items-start border border-primary/10">
                        <Info className="text-primary shrink-0" size={20} />
                        <p className="text-[11px] leading-relaxed font-bold uppercase tracking-wide opacity-80">
                            These factors determine the estimated impressions shown to users. 
                            Impressions range = Budget × Factor. 
                            Example: ₹99 × 14 = 1.4K min reach.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Min. Reach Factor (Impressions per ₹)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={settings.minImpressionFactor}
                                onChange={(e) => setSettings({ ...settings, minImpressionFactor: Number(e.target.value) })}
                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Max. Reach Factor (Impressions per ₹)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={settings.maxImpressionFactor}
                                onChange={(e) => setSettings({ ...settings, maxImpressionFactor: Number(e.target.value) })}
                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-surface/50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-3 opacity-60">Reach Simulation (Preview)</p>
                        <div className="flex gap-8">
                            <div className="bg-bg p-3 rounded-lg border border-surface">
                                <p className="text-[9px] font-bold text-muted uppercase">₹99 Daily</p>
                                <p className="text-sm font-black text-primary">{(99 * settings.minImpressionFactor / 1000).toFixed(1)}K - {(99 * settings.maxImpressionFactor / 1000).toFixed(1)}K</p>
                            </div>
                            <div className="bg-bg p-3 rounded-lg border border-surface">
                                <p className="text-[9px] font-bold text-muted uppercase">₹1,000 Daily</p>
                                <p className="text-sm font-black text-primary">{(1000 * settings.minImpressionFactor / 1000).toFixed(0)}K - {(1000 * settings.maxImpressionFactor / 1000).toFixed(0)}K</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

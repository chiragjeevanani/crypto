import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Save,
    X,
    Target,
    Calendar,
    ArrowLeft,
    CheckCircle2,
    DollarSign,
    Users,
    Activity,
    Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminPageHeader } from '../components/shared';
import { formatCurrency } from '../utils/currency';

// Mock data
const mockCampaigns = [
    {
        id: 'C-101',
        title: 'Summer Splash Brand Task',
        brand: 'Pepsi Co',
        budget: 5000,
        participants: 1240,
        status: 'Active',
        endDate: '2026-09-12',
        progress: 65,
        color: 'emerald-500'
    },
    {
        id: 'C-102',
        title: 'Eco-Friendly Challenge',
        brand: 'Green Earth',
        budget: 2500,
        participants: 850,
        status: 'Paused',
        endDate: '2026-10-05',
        progress: 30,
        color: 'amber-500'
    },
    {
        id: 'C-103',
        title: 'New App Review Blast',
        brand: 'TechVibe',
        budget: 10000,
        participants: 4500,
        status: 'Active',
        endDate: '2026-08-28',
        progress: 92,
        color: 'primary'
    }
];

export default function EditCampaign() {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const campaign = mockCampaigns.find(c => c.id === campaignId);
        if (campaign) {
            setFormData({ ...campaign });
        } else {
            navigate('/admin/campaigns');
        }
    }, [campaignId, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }, 1000);
    };

    if (!formData) return null;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => navigate('/admin/campaigns')}
                    className="p-2 bg-surface border border-surface rounded-lg text-muted hover:text-text hover:bg-surface2 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-surface mx-1"></div>
                <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted">
                    <span>Admin</span>
                    <span className="opacity-30">/</span>
                    <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/admin/campaigns')}>Campaigns</span>
                    <span className="opacity-30">/</span>
                    <span className="text-text">Edit Protocol {formData.id}</span>
                </nav>
            </div>

            <AdminPageHeader
                title={`Edit Mandate: ${formData.id}`}
                subtitle={`Reconfigure resource allocation and targeting metrics for ${formData.title}.`}
                actions={
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin/campaigns')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text"
                        >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                            {isSaving ? 'Propagating...' : 'Commit Changes'}
                        </button>
                    </div>
                }
            />

            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 text-emerald-500 mb-6"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        <p className="text-[11px] font-bold uppercase tracking-wider">Mandate configuration updated successfully.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface border border-surface rounded-lg p-8">
                        <div className="space-y-6 mb-8">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Target className="w-3 h-3" /> Mandate Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">Brand Authority</label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <DollarSign className="w-3 h-3" /> Allocated Budget ({import.meta.env.VITE_CURRENCY || '$'})
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">{import.meta.env.VITE_CURRENCY || '$'}</span>
                                        <input
                                            type="number"
                                            value={formData.budget}
                                            onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                                            className="w-full bg-bg border border-surface rounded-xl py-3 pl-8 pr-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> Termination Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Activity className="w-3 h-3" /> Completion Progress
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={formData.progress}
                                            onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                                            className="flex-1 accent-primary h-1 bg-bg rounded-full appearance-none cursor-pointer"
                                        />
                                        <span className="text-xs font-bold text-primary w-8">{formData.progress}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-4">
                            <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">Operational Lock</p>
                                <p className="text-[10px] text-primary/60 font-medium leading-relaxed uppercase tracking-widest">
                                    Significant changes to live mandates may cause participant desync. Ensure delta is within acceptable variance.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface border border-surface rounded-lg p-6 space-y-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" /> Protocol State
                        </h4>
                        <div className="space-y-3">
                            {['Active', 'Paused', 'Terminated'].map((status) => (
                                <label key={status} className="flex items-center gap-3 p-3 bg-bg border border-surface rounded-lg cursor-pointer hover:bg-surface2 transition-all">
                                    <input
                                        type="radio"
                                        name="status"
                                        checked={formData.status === status}
                                        onChange={() => setFormData({ ...formData, status })}
                                        className="accent-primary"
                                    />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${status === 'Active' ? 'text-emerald-500' :
                                            status === 'Paused' ? 'text-amber-500' : 'text-rose-500'
                                        }`}>{status}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="bg-surface border border-surface rounded-lg p-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> Engagement Flux
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Current Nodes</span>
                                <span className="text-xs font-bold text-text">{formData.participants.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Cost/Node</span>
                                <span className="text-xs font-bold text-text">{formatCurrency(formData.budget / formData.participants)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

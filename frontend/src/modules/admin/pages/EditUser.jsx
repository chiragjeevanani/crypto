import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Save,
    X,
    User,
    Mail,
    Shield,
    Wallet,
    Calendar,
    ArrowLeft,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminPageHeader } from '../components/shared';
import { formatCurrency } from '../utils/currency';

// Mock data fetch - in real app this would be an API call
const mockUsers = [
    {
        id: 'U-7721',
        name: 'CryptoWhale_88',
        email: 'whale@crypto.com',
        status: 'Verified',
        riskScore: 'Low',
        joined: 'Jan 12, 2024',
        walletBalance: 1240.50,
        campaigns: 12,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
    },
    {
        id: 'U-7722',
        name: 'BotHunter_X',
        email: 'bh@gmail.com',
        status: 'Flagged',
        riskScore: 'High',
        joined: 'Feb 05, 2024',
        walletBalance: 45.00,
        campaigns: 2,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    },
    {
        id: 'U-7723',
        name: 'MemeMaster',
        email: 'meme@xyz.com',
        status: 'Pending',
        riskScore: 'Medium',
        joined: 'Feb 20, 2024',
        walletBalance: 210.00,
        campaigns: 5,
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop'
    }
];

export default function EditUser() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
            setFormData({ ...user });
        } else {
            // Handle user not found
            navigate('/admin/users');
        }
    }, [userId, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate API call
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
                    onClick={() => navigate('/admin/users')}
                    className="p-2 bg-surface border border-surface rounded-lg text-muted hover:text-text hover:bg-surface2 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-surface mx-1"></div>
                <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted">
                    <span>Admin</span>
                    <span className="opacity-30">/</span>
                    <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/admin/users')}>Users</span>
                    <span className="opacity-30">/</span>
                    <span className="text-text">Edit {formData.id}</span>
                </nav>
            </div>

            <AdminPageHeader
                title={`Edit Identity: ${formData.id}`}
                subtitle={`Modify platform privileges and profile data for @${formData.name}.`}
                actions={
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin/users')}
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
                            {isSaving ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                >
                                    <Save className="w-3.5 h-3.5" />
                                </motion.div>
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
                            {isSaving ? 'Committing...' : 'Save Changes'}
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
                        <p className="text-[11px] font-bold uppercase tracking-wider">Registry updated successfully. Changes propagated to all nodes.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Overview */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface border border-surface rounded-lg p-6 text-center">
                        <div className="relative inline-block mx-auto mb-6">
                            <div className="w-24 h-24 rounded-2xl bg-surface2 border border-surface p-1.5 overflow-hidden">
                                <img src={formData.avatar} className="w-full h-full object-cover rounded-xl" alt="" />
                            </div>
                            <button className="absolute -bottom-2 -right-2 p-2 bg-primary text-black rounded-lg shadow-lg hover:scale-105 transition-transform">
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <h3 className="text-lg font-bold text-text mb-1">@{formData.name}</h3>
                        <p className="text-[10px] font-medium text-muted uppercase tracking-[0.2em]">{formData.email}</p>

                        <div className="mt-8 pt-6 border-t border-surface space-y-4 text-left">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-muted">Account Age</span>
                                <span className="text-text">{formData.joined}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-muted">Trust Factor</span>
                                <span className={`${formData.riskScore === 'Low' ? 'text-emerald-500' :
                                        formData.riskScore === 'Medium' ? 'text-amber-500' : 'text-rose-500'
                                    }`}>{formData.riskScore} Risk</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-surface rounded-lg p-6 space-y-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5" /> Identity Controls
                        </h4>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 bg-bg border border-surface rounded-lg cursor-pointer hover:bg-surface2 transition-all">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={formData.status === 'Verified'}
                                    onChange={() => setFormData({ ...formData, status: 'Verified' })}
                                    className="accent-primary"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Verified Identity</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-bg border border-surface rounded-lg cursor-pointer hover:bg-surface2 transition-all">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={formData.status === 'Pending'}
                                    onChange={() => setFormData({ ...formData, status: 'Pending' })}
                                    className="accent-primary"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Pending Review</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-bg border border-surface rounded-lg cursor-pointer hover:bg-rose-500/5 transition-all">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={formData.status === 'Flagged'}
                                    onChange={() => setFormData({ ...formData, status: 'Flagged' })}
                                    className="accent-primary"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Flagged identity</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Main Fields */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface border border-surface rounded-lg p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <User className="w-3 h-3" /> Handle / Username
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Mail className="w-3 h-3" /> Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Wallet className="w-3 h-3" /> Wallet Balance ({import.meta.env.VITE_CURRENCY || '$'})
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">{import.meta.env.VITE_CURRENCY || '$'}</span>
                                    <input
                                        type="number"
                                        value={formData.walletBalance}
                                        onChange={(e) => setFormData({ ...formData, walletBalance: parseFloat(e.target.value) })}
                                        className="w-full bg-bg border border-surface rounded-xl py-3 pl-8 pr-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Shield className="w-3 h-3" /> Risk Coefficient
                                </label>
                                <select
                                    value={formData.riskScore}
                                    onChange={(e) => setFormData({ ...formData, riskScore: e.target.value })}
                                    className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                >
                                    <option value="Low">Low Risk</option>
                                    <option value="Medium">Medium Risk</option>
                                    <option value="High">High Risk</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl flex items-start gap-4">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">Hyper-Admin Warning</p>
                                <p className="text-[10px] text-amber-500/60 font-medium leading-relaxed uppercase tracking-widest">
                                    Identity modifications affect mission logic and payout sequences. All changes are immutable once committed to the ledger.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface/50 border border-surface border-dashed rounded-lg p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-surface rounded-xl text-muted">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-text">Last Registry Sync</p>
                                <p className="text-[10px] font-medium text-muted uppercase tracking-widest">24.02.2024 - 14:22:01</p>
                            </div>
                        </div>
                        <button type="button" className="px-4 py-2 bg-surface hover:bg-surface2 border border-surface rounded-lg text-[9px] font-bold uppercase tracking-widest text-muted transition-all">
                            Purge Cache
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

// Fixed import for Edit icon which was used in profile overview
function Edit2(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
        </svg>
    );
}

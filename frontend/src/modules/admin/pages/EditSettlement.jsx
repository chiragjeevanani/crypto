import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Save,
    X,
    DollarSign,
    User,
    CreditCard,
    Calendar,
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    Hash,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminPageHeader } from '../components/shared';
import { formatCurrency } from '../utils/currency';

// Mock data
const mockSettlements = [
    { id: 'W-9821', user: 'Alex Rivera', amount: 450.00, method: 'USDT (TRC20)', status: 'Pending', date: '2024-02-26 14:20' },
    { id: 'W-9822', user: 'Sarah Chen', amount: 1200.00, method: 'Verifying', status: 'Verifying', date: '2024-02-26 13:10' },
    { id: 'W-9823', user: 'Mike Ross', amount: 85.00, method: 'Paypal', status: 'Pending', date: '2024-02-26 12:45' },
];

export default function EditSettlement() {
    const { settlementId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const settlement = mockSettlements.find(s => s.id === settlementId);
        if (settlement) {
            setFormData({ ...settlement });
        } else {
            navigate('/admin/withdrawals');
        }
    }, [settlementId, navigate]);

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
                    onClick={() => navigate('/admin/withdrawals')}
                    className="p-2 bg-surface border border-surface rounded-lg text-muted hover:text-text hover:bg-surface2 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-surface mx-1"></div>
                <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted">
                    <span>Admin</span>
                    <span className="opacity-30">/</span>
                    <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/admin/withdrawals')}>Finance</span>
                    <span className="opacity-30">/</span>
                    <span className="text-text">Modify {formData.id}</span>
                </nav>
            </div>

            <AdminPageHeader
                title={`Modify Settlement: ${formData.id}`}
                subtitle={`Adjust liquidation parameters and verification status for ${formData.user}.`}
                actions={
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin/withdrawals')}
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
                            {isSaving ? 'Processing...' : 'Modify Protocol'}
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
                        <p className="text-[11px] font-bold uppercase tracking-wider">Settlement protocol updated. Re-queued for validation.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface border border-surface rounded-lg p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <User className="w-3 h-3" /> Recipient Identification
                                </label>
                                <input
                                    type="text"
                                    value={formData.user}
                                    readOnly
                                    className="w-full bg-bg/50 border border-surface rounded-xl py-3 px-4 text-xs font-semibold text-muted outline-none"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Hash className="w-3 h-3" /> Settlement ID
                                </label>
                                <input
                                    type="text"
                                    value={formData.id}
                                    readOnly
                                    className="w-full bg-bg/50 border border-surface rounded-xl py-3 px-4 text-xs font-semibold text-muted outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <DollarSign className="w-3 h-3" /> Quantum Amount ({import.meta.env.VITE_CURRENCY || '$'})
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">{import.meta.env.VITE_CURRENCY || '$'}</span>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                        className="w-full bg-bg border border-surface rounded-xl py-3 pl-8 pr-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <CreditCard className="w-3 h-3" /> Liquidation Method
                                </label>
                                <select
                                    value={formData.method}
                                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                    className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-xs font-semibold focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text"
                                >
                                    <option value="USDT (TRC20)">USDT (TRC20)</option>
                                    <option value="USDT (ERC20)">USDT (ERC20)</option>
                                    <option value="Paypal">Paypal</option>
                                    <option value="Verifying">Verifying</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl flex items-start gap-4">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">Monetary Audit Alert</p>
                                <p className="text-[10px] text-amber-500/60 font-medium leading-relaxed uppercase tracking-widest">
                                    Adjusting liquidation amounts bypasses standard mission audit rules. This action triggers a higher-level compliance flag.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface border border-surface rounded-lg p-6 space-y-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5" /> Validation Status
                        </h4>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 bg-bg border border-surface rounded-lg cursor-pointer hover:bg-surface2 transition-all">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={formData.status === 'Pending'}
                                    onChange={() => setFormData({ ...formData, status: 'Pending' })}
                                    className="accent-primary"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Awaiting Liquidity</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-bg border border-surface rounded-lg cursor-pointer hover:bg-surface2 transition-all">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={formData.status === 'Verifying'}
                                    onChange={() => setFormData({ ...formData, status: 'Verifying' })}
                                    className="accent-primary"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Identity Validation</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-bg border border-surface rounded-lg cursor-pointer hover:bg-emerald-500/5 transition-all">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={formData.status === 'Approved'}
                                    onChange={() => setFormData({ ...formData, status: 'Approved' })}
                                    className="accent-primary"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Ready for Broadcast</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-surface/50 border border-surface border-dashed rounded-lg p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-surface rounded-xl text-muted">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-text">Request Date</p>
                                <p className="text-[10px] font-medium text-muted uppercase tracking-widest">{formData.date}</p>
                            </div>
                        </div>
                        <p className="text-[9px] text-muted font-medium uppercase tracking-widest leading-relaxed">
                            Originating from Node: US-EAST-1. <br />
                            Total lifetime payouts: {formatCurrency(4200.50)}
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}

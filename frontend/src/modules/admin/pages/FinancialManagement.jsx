import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
    Gift,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Settings,
    PieChart,
    Download,
    Cpu,
    ArrowUpRight,
    Plus,
    Edit2,
    ChevronRight,
    Trash2,
    Eye,
    History,
    FileText,
    Activity,
    AlertCircle,
    Info,
    X,
    Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminPageHeader, AdminStatCard, AdminDataTable } from '../components/shared';
import { formatCurrency } from '../utils/currency';
import { useAdminStore } from '../store/useAdminStore';

const pendingWithdrawals = [
    { id: 'W-9821', user: 'Alex Rivera', amount: 450.00, method: 'USDT (TRC20)', status: 'Pending', date: '2024-02-26 14:20' },
    { id: 'W-9822', user: 'Sarah Chen', amount: 1200.00, method: 'Verifying', status: 'Verifying', date: '2024-02-26 13:10' },
    { id: 'W-9823', user: 'Mike Ross', amount: 85.00, method: 'Paypal', status: 'Pending', date: '2024-02-26 12:45' },
];

const giftAssets = [
    { id: 1, name: 'Rose', price: '10 Coins', value: '$0.10', icon: '🌹', status: 'Active' },
    { id: 2, name: 'Rocket', price: '500 Coins', value: '$5.00', icon: '🚀', status: 'Active' },
    { id: 3, name: 'Diamond', price: '1000 Coins', value: '$10.00', icon: '💎', status: 'Active' },
    { id: 4, name: 'Crown', price: '5000 Coins', value: '$50.00', icon: '👑', status: 'Inactive' },
];

export default function FinancialManagement() {
    const {
        withdrawals, loadWithdrawals, approveWithdrawal, rejectWithdrawal, getUserFinancialSnapshot,
        gifts, loadGifts, addGift, updateGift, removeGift, toggleGiftStatus,
        settings, loadSettings, updatePlatformSettings,
        isLoading
    } = useAdminStore();

    const [selectedSettlement, setSelectedSettlement] = useState(null);
    const [withdrawalFilter, setWithdrawalFilter] = useState('all');
    const [reviewWithdrawal, setReviewWithdrawal] = useState(null);
    const [userSnapshot, setUserSnapshot] = useState(null);

    const [giftModalOpen, setGiftModalOpen] = useState(false);
    const [editingGift, setEditingGift] = useState(null);
    const [giftFormData, setGiftFormData] = useState({ name: '', price: 0, icon: '🎁', commission: 15, status: 'Active' });

    const navigate = useNavigate();

    useEffect(() => {
        loadWithdrawals(withdrawalFilter);
        loadGifts();
        loadSettings();
    }, [loadWithdrawals, loadGifts, loadSettings, withdrawalFilter]);

    const handleWithdrawalReview = async (w) => {
        setReviewWithdrawal(w);
        const snapshot = await getUserFinancialSnapshot(w.userId);
        setUserSnapshot(snapshot);
    };

    const handleApprove = (id) => {
        if (window.confirm('Broadcast approval to network? This will dedicate vault liquidity.')) {
            approveWithdrawal(id);
            setReviewWithdrawal(null);
        }
    };

    const handleReject = (id) => {
        const reason = window.prompt('Provide mandatory rejection cause for protocol log:');
        if (reason) {
            rejectWithdrawal(id, reason);
            setReviewWithdrawal(null);
        }
    };

    const handleGiftSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingGift) {
                await updateGift(editingGift.id, giftFormData);
            } else {
                await addGift(giftFormData);
            }
            setGiftModalOpen(false);
            setEditingGift(null);
            setGiftFormData({ name: '', price: 0, icon: '🎁', commission: 15, status: 'Active' });
        } catch (err) {
            // Error handled by store
        }
    };

    const openEditGift = (gift) => {
        setEditingGift(gift);
        setGiftFormData({ name: gift.name, price: gift.price, icon: gift.icon, commission: gift.commission || 15, status: gift.status });
        setGiftModalOpen(true);
    };

    const handleDeleteGift = (id) => {
        if (window.confirm('Delete this asset from registry? This action is permanent and only allowed if no transaction history exists.')) {
            removeGift(id);
        }
    };

    const handleSettingChange = (key, value) => {
        updatePlatformSettings({ [key]: value });
    };

    if (!settings) return null;

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Profitability Logic"
                subtitle="Monetary protocol management and asset liquidation control."
                actions={
                    <div className="flex gap-3">
                        <button
                            onClick={() => alert('Compiling Financial Ledger for Export...')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export Ledger
                        </button>
                        <button
                            onClick={() => alert('Initiating Batch Liquidation Sequence...')}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md hover:bg-primary/90 transition-all font-bold"
                        >
                            <Cpu className="w-3.5 h-3.5" />
                            Process Batch
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard label="Total Payouts" value={formatCurrency(142801)} change="+12.4%" icon={DollarSign} color="emerald-500" path="/admin/wallet" />
                <AdminStatCard label="Pending Volume" value={formatCurrency(4210)} change="+2.1%" icon={TrendingUp} color="amber-500" path="/admin/withdrawals" />
                <AdminStatCard label="Gift Revenue" value={formatCurrency(42500)} change="+8.5%" icon={Gift} color="primary" path="/admin/gifts" />
                <AdminStatCard label="Net Commission" value={formatCurrency(12400)} change="+5.2%" icon={PieChart} color="indigo-500" path="/admin/financials" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Commission Setting Card */}
                <div className="bg-surface border border-surface rounded-lg p-6 xl:col-span-1 space-y-8 h-fit">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary border border-surface">
                            <Settings className="w-4 h-4" />
                        </div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text">System Parameters</h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-[10px] text-muted font-bold uppercase tracking-wider">Commission (%)</label>
                                <span className="text-sm font-bold text-primary">{settings.commission}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                value={settings.commission}
                                onChange={(e) => handleSettingChange('commission', parseInt(e.target.value))}
                                className="w-full accent-primary h-1 bg-surface2 rounded-full appearance-none cursor-pointer"
                            />
                            <p className="text-[9px] text-muted font-medium uppercase tracking-wider mt-3 italic opacity-60">Applied to gift swaps and task rewards.</p>
                        </div>

                        <div className="pt-6 border-t border-surface/50 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] text-muted font-bold uppercase tracking-wider ml-0.5">Min Withdrawal ({import.meta.env.VITE_CURRENCY || '$'})</label>
                                <input
                                    type="number"
                                    value={settings.minWithdrawal}
                                    onChange={(e) => handleSettingChange('minWithdrawal', parseInt(e.target.value))}
                                    className="w-full bg-bg border border-surface rounded-lg py-2.5 px-4 font-semibold text-xs text-text outline-none focus:ring-1 focus:ring-primary/20"
                                />
                            </div>
                            <button className="w-full py-3 bg-surface2 hover:bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all mt-4">Commit Settings</button>
                        </div>
                    </div>
                </div>

                {/* Withdrawal Queue Control Panel */}
                <div className="xl:col-span-3 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2 p-1 bg-surface2 border border-surface rounded-lg">
                            {['all', 'pending', 'processing', 'approved', 'rejected'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setWithdrawalFilter(f)}
                                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${withdrawalFilter === f ? 'bg-primary text-black shadow-sm' : 'text-muted hover:text-text'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1.5 bg-surface border border-surface rounded-lg flex items-center gap-2 text-[10px] font-semibold text-muted">
                                <Filter className="w-3.5 h-3.5" />
                                <span className="uppercase tracking-widest">Filters Active</span>
                            </div>
                        </div>
                    </div>

                    <AdminDataTable
                        title="Settlement Queue"
                        columns={["ID", "Recipient", "Method", "Status", "Amount", "Actions"]}
                        onRowClick={(row) => handleWithdrawalReview(withdrawals.find(w => w.id === row.id))}
                        data={withdrawals.map(w => ({
                            id: w.id,
                            cells: [
                                <span className="font-mono text-muted text-[10px]">{w.id}</span>,
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-surface2 border border-surface flex items-center justify-center text-[9px] font-bold text-text">{w.user[0]}</div>
                                    <div>
                                        <p className="text-xs font-semibold text-text">{w.user}</p>
                                        <p className="text-[9px] text-muted font-medium uppercase tracking-wider">{w.date}</p>
                                    </div>
                                </div>,
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{w.method}</span>,
                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-semibold uppercase tracking-wider border ${w.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    w.status === 'processing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                        w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                    }`}>
                                    {w.status}
                                </span>,
                                <span className="text-xs font-semibold text-emerald-500">{formatCurrency(w.amount)}</span>,
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleWithdrawalReview(w);
                                        }}
                                        className="p-1.5 rounded-lg bg-surface2 border border-surface hover:bg-surface hover:text-primary transition-all group/edit"
                                        title="Deep Review"
                                    >
                                        <Eye className="w-3.5 h-3.5 text-muted group-hover/edit:text-primary" />
                                    </button>
                                    {w.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleApprove(w.id); }}
                                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleReject(w.id); }}
                                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all border border-rose-500/20 font-bold"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ]
                        }))}
                    />
                </div>
            </div>

            {/* Gift Inventory Section */}
            <div className="bg-surface border border-surface rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-surface">
                            <Gift className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-text">Tokenomics & Gifts</h3>
                            <p className="text-[9px] text-muted font-medium uppercase tracking-wider mt-1 opacity-60">Multi-asset liquidity management.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {gifts.map((gift) => (
                        <motion.div
                            whileHover={{ y: -2 }}
                            key={gift.id}
                            className="p-5 rounded-lg bg-bg border border-surface hover:border-primary/20 transition-all group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start">
                                <div className="text-2xl mb-4 grayscale group-hover:grayscale-0 transition-all duration-500">
                                    {gift.icon}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openEditGift(gift)}
                                        className="p-1.5 hover:bg-surface2 rounded-md transition-colors text-muted hover:text-primary"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGift(gift.id)}
                                        className="p-1.5 hover:bg-rose-500/10 rounded-md transition-colors text-muted hover:text-rose-500"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="text-xs font-bold text-text uppercase tracking-wider">{gift.name}</h4>
                                <button
                                    onClick={() => toggleGiftStatus(gift.id)}
                                    className={`text-[8px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider border transition-all ${gift.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-surface2 text-muted border-surface'
                                        }`}
                                >
                                    {gift.status}
                                </button>
                            </div>
                            <div className="space-y-2 mb-5">
                                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                                    <span className="text-muted">Usage Flux</span>
                                    <span className="text-text">{gift.usage.toLocaleString()} Units</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                                    <span className="text-muted">Net Yield</span>
                                    <span className="text-emerald-500">{formatCurrency(gift.price * gift.usage)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-surface/50">
                                    <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Fee</span>
                                    <span className="text-[10px] font-bold text-primary">{gift.commission}%</span>
                                </div>
                            </div>
                            <div className="p-3 bg-surface2/50 rounded-lg border border-surface flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <p className="text-[8px] font-bold text-muted uppercase">Value</p>
                                    <p className="text-[10px] font-bold text-text">{formatCurrency(gift.value)}</p>
                                </div>
                                <div className="text-right space-y-0.5">
                                    <p className="text-[8px] font-bold text-muted uppercase">Cost</p>
                                    <p className="text-[10px] font-bold text-primary">{gift.price} Coins</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    <button
                        onClick={() => navigate('/admin/gifts/create')}
                        className="border border-dashed border-surface rounded-lg flex flex-col items-center justify-center p-6 text-muted hover:text-primary hover:border-primary/50 transition-all gap-2 bg-surface2/10 group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-surface border border-surface flex items-center justify-center group-hover:bg-primary/10 transition-all">
                            <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Deploy Asset</span>
                    </button>
                </div>
            </div>

            {/* Gift Modal */}
            <AnimatePresence>
                {giftModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-surface border border-surface w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-surface flex justify-between items-center bg-surface2/50">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-text">
                                    {editingGift ? 'Modify Asset' : 'Deploy Asset'}
                                </h3>
                                <button onClick={() => setGiftModalOpen(false)} className="text-muted hover:text-text transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <form onSubmit={handleGiftSubmit} className="p-6 space-y-5">
                                <div className="flex gap-4">
                                    <div className="space-y-2 flex-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Asset Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={giftFormData.name}
                                            onChange={(e) => setGiftFormData({ ...giftFormData, name: e.target.value })}
                                            className="w-full bg-bg border border-surface rounded-lg p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/20 text-text"
                                        />
                                    </div>
                                    <div className="space-y-2 w-24">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Icon</label>
                                        <input
                                            required
                                            type="text"
                                            value={giftFormData.icon}
                                            onChange={(e) => setGiftFormData({ ...giftFormData, icon: e.target.value })}
                                            className="w-full bg-bg border border-surface rounded-lg p-2.5 text-center text-lg outline-none focus:ring-1 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Price (Coins)</label>
                                        <input
                                            required
                                            type="number"
                                            value={giftFormData.price}
                                            onChange={(e) => setGiftFormData({ ...giftFormData, price: parseInt(e.target.value) })}
                                            className="w-full bg-bg border border-surface rounded-lg p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/20 text-text"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Fee (%)</label>
                                        <input
                                            required
                                            type="number"
                                            value={giftFormData.commission}
                                            onChange={(e) => setGiftFormData({ ...giftFormData, commission: parseInt(e.target.value) })}
                                            className="w-full bg-bg border border-surface rounded-lg p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/20 text-text"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setGiftModalOpen(false)}
                                        className="flex-1 py-3 bg-bg border border-surface rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted hover:text-text transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-[2] py-3 bg-primary text-black rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                                    >
                                        {isLoading ? 'Processing...' : editingGift ? 'Commit Changes' : 'Initialize Asset'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Withdrawal Review Panel */}
            <AnimatePresence>
                {reviewWithdrawal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex justify-end bg-black/40 backdrop-blur-sm"
                        onClick={() => setReviewWithdrawal(null)}
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-md bg-bg border-l border-surface h-screen shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-surface flex justify-between items-center bg-surface2/30">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-text">Settlement Review</h3>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-tighter mt-1">{reviewWithdrawal.id}</p>
                                </div>
                                <button onClick={() => setReviewWithdrawal(null)} className="p-2 hover:bg-surface rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-muted" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                <div className="p-5 bg-surface rounded-2xl border border-surface text-center">
                                    <div className="w-20 h-20 rounded-2xl bg-surface2 border border-surface mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-text">
                                        {reviewWithdrawal.user[0]}
                                    </div>
                                    <h4 className="text-base font-bold text-text">{reviewWithdrawal.user}</h4>
                                    <div className="mt-2 flex items-center justify-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${reviewWithdrawal.kycStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            }`}>
                                            Identity: {reviewWithdrawal.kycStatus}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-primary" /> Wallet Telemetry
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-surface2/50 border border-surface rounded-xl text-text">
                                            <p className="text-[9px] font-bold text-muted uppercase mb-1">Impact</p>
                                            <p className="text-sm font-bold">{reviewWithdrawal.historyCount} Tx</p>
                                        </div>
                                        <div className="p-4 bg-surface2/50 border border-surface rounded-xl">
                                            <p className="text-[9px] font-bold text-muted uppercase mb-1">Deduction</p>
                                            <p className="text-sm font-bold text-rose-500">-{formatCurrency(reviewWithdrawal.amount)}</p>
                                        </div>
                                    </div>
                                </div>

                                {userSnapshot && (
                                    <div className="space-y-4">
                                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                                            <History className="w-4 h-4 text-primary" /> Integrity Ledger
                                        </h5>
                                        <div className="space-y-2">
                                            {userSnapshot.history.length > 0 ? userSnapshot.history.map((tx, idx) => (
                                                <div key={idx} className="p-3 bg-surface/30 border border-surface rounded-lg flex justify-between items-center text-[10px] font-medium text-text">
                                                    <span className="text-muted">{tx.type}</span>
                                                    <span className={tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                                    </span>
                                                </div>
                                            )) : (
                                                <div className="p-8 text-center border border-dashed border-surface rounded-xl opacity-40 text-text">
                                                    <Info className="w-5 h-5 mx-auto mb-2" />
                                                    <p className="text-[9px] font-bold uppercase">No Prior Records</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-surface bg-bg flex flex-col gap-3">
                                {reviewWithdrawal.status === 'pending' ? (
                                    <>
                                        <button
                                            onClick={() => handleApprove(reviewWithdrawal.id)}
                                            className="w-full py-4 bg-primary text-black rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                                        >
                                            Authorize & Settle
                                        </button>
                                        <button
                                            onClick={() => handleReject(reviewWithdrawal.id)}
                                            className="w-full py-4 bg-bg border border-rose-500/20 text-rose-500 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                                        >
                                            Reject Protocol
                                        </button>
                                    </>
                                ) : (
                                    <div className="p-4 bg-surface rounded-xl border border-surface text-center text-text">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Finalized</p>
                                        <p className="text-xs font-bold mt-1">Status: {reviewWithdrawal.status}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

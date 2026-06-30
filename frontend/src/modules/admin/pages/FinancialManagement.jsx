import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
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
    Filter,
    ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminPageHeader, AdminStatCard, AdminDataTable } from '../components/shared';
import { formatCurrency } from '../utils/currency';
import { useAdminStore } from '../store/useAdminStore';
import { getSocket } from '../../../socket';

const pendingWithdrawals = [
    { id: 'W-9821', user: 'Alex Rivera', amount: 450.00, method: 'USDT (TRC20)', status: 'Pending', date: '2024-02-26 14:20' },
    { id: 'W-9822', user: 'Sarah Chen', amount: 1200.00, method: 'Verifying', status: 'Verifying', date: '2024-02-26 13:10' },
    { id: 'W-9823', user: 'Mike Ross', amount: 85.00, method: 'Paypal', status: 'Pending', date: '2024-02-26 12:45' },
];


export default function FinancialManagement() {
    const {
        withdrawals, loadWithdrawals, approveWithdrawal, rejectWithdrawal, getUserFinancialSnapshot,
        settings, settlementRails, loadSettlementRails, reconcileSettlementRail, loadSettings, updatePlatformSettings,
        isLoading
    } = useAdminStore();

    const [selectedSettlement, setSelectedSettlement] = useState(null);
    const [withdrawalFilter, setWithdrawalFilter] = useState('all');
    const [reviewWithdrawal, setReviewWithdrawal] = useState(null);
    const [userSnapshot, setUserSnapshot] = useState(null);
    const [actionModal, setActionModal] = useState({ show: false, type: '', id: null, title: '', message: '', color: '' });
    const [rejectionReason, setRejectionReason] = useState('');


    const navigate = useNavigate();

    const exportLedgerCsv = () => {
        const rows = [
            ['ID', 'User', 'Amount', 'Method', 'Status', 'Date'],
            ...withdrawals.map((w) => [w.id, w.user, w.amount, w.method, w.status, w.date]),
        ];
        const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `withdrawals-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        loadWithdrawals(withdrawalFilter);
        loadSettings();
        loadSettlementRails();
    }, [loadWithdrawals, loadSettings, withdrawalFilter]);

    useEffect(() => {
        const socket = getSocket();
        if (!socket.connected) socket.connect();

        const onNewWithdrawalRequest = (payload) => {
            console.log('[Socket] Real-time withdrawal request received:', payload);
            loadWithdrawals(withdrawalFilter);
        };

        socket.on('new_withdrawal_request', onNewWithdrawalRequest);

        return () => {
            socket.off('new_withdrawal_request', onNewWithdrawalRequest);
        };
    }, [loadWithdrawals, withdrawalFilter]);

    const handleWithdrawalReview = async (w) => {
        setReviewWithdrawal(w);
        const snapshot = await getUserFinancialSnapshot(w.userId);
        setUserSnapshot(snapshot);
    };

    const handleApprove = (id) => {
        setActionModal({
            show: true,
            type: 'approve',
            id,
            title: 'Confirm Approval',
            message: 'Broadcast approval to network? This will dedicate vault liquidity.',
            color: 'emerald-500'
        });
    };

    const handleReject = (id) => {
        setRejectionReason('');
        setActionModal({
            show: true,
            type: 'reject',
            id,
            title: 'Reject Protocol',
            message: 'Provide mandatory rejection cause for protocol log:',
            color: 'rose-500'
        });
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
                            onClick={exportLedgerCsv}
                            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export Ledger
                        </button>
                        <button
                            onClick={() => {
                                settlementRails.forEach((rail) => reconcileSettlementRail(rail.id));
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md hover:bg-primary/90 transition-all font-bold"
                        >
                            <Cpu className="w-3.5 h-3.5" />
                            Reconcile Batch
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AdminStatCard label="Total Payouts" value={formatCurrency(142801)} change="+12.4%" icon={DollarSign} color="emerald-500" path="/admin/wallet" />
                <AdminStatCard label="Pending Volume" value={formatCurrency(4210)} change="+2.1%" icon={TrendingUp} color="amber-500" path="/admin/withdrawals" />
                <AdminStatCard label="Net Commission" value={formatCurrency(12400)} change="+5.2%" icon={PieChart} color="indigo-500" path="/admin/wallet" />

            </div>

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 p-1 bg-surface2 border border-surface rounded-lg">
                        {['all', 'pending', 'approved', 'rejected'].map((f) => (
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
                                <div className="w-7 h-7 rounded-lg bg-surface2 border border-surface flex items-center justify-center text-[9px] font-bold text-text">
                                    {(w.user || w.userId || 'U')[0]}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-text">{w.user || w.userId}</p>
                                    <p className="text-[9px] text-muted font-medium uppercase tracking-wider">{w.date}</p>
                                </div>
                            </div>,
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{w.method}</span>,
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-semibold uppercase tracking-wider border ${w.status === 'pending' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                }`}>
                                {w.status}
                            </span>,
                            <span className="text-xs font-semibold text-emerald-500">{formatCurrency(w.amount)} · {w.coins} coins</span>,
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

                <div className="bg-surface border border-surface rounded-lg p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-text mb-3">Settlement Rails</h4>
                    <div className="space-y-2">
                        {settlementRails.map((rail) => (
                            <div key={rail.id} className="flex items-center justify-between p-3 rounded-lg bg-bg border border-surface">
                                <div>
                                    <p className="text-xs font-semibold text-text">{rail.name}</p>
                                    <p className="text-[9px] text-muted uppercase tracking-wider">
                                        Reconciled: {rail.reconciled} · Pending: {rail.pending} · Last: {rail.lastRun}
                                    </p>
                                </div>
                                <button
                                    onClick={() => reconcileSettlementRail(rail.id)}
                                    className="px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20"
                                >
                                    Reconcile
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


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
                                    <div className="w-20 h-20 rounded-2xl bg-surface2 border border-surface mx-auto mb-4 flex items-center justify-center overflow-hidden">
                                        {reviewWithdrawal.userId?.avatar ? (
                                            <img src={reviewWithdrawal.userId.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl font-bold text-text">
                                                {(reviewWithdrawal.userId?.name || reviewWithdrawal.user || 'U')[0]}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-base font-bold text-text">{reviewWithdrawal.userId?.name || reviewWithdrawal.user}</h4>
                                    <div className="mt-1 space-y-1">
                                        <p className="text-[10px] font-semibold text-muted lowercase">{reviewWithdrawal.userId?.email || 'No email'}</p>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{reviewWithdrawal.userId?.phone || 'No phone'}</p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${reviewWithdrawal.status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                            }`}>
                                            Account Status: {reviewWithdrawal.status || 'Unknown'}
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
                                    
                                    <div className="p-4 bg-surface/30 border border-surface rounded-xl space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                            <span className="text-muted uppercase">Gross Amount</span>
                                            <span className="text-text">{formatCurrency(reviewWithdrawal.grossAmount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                            <span className="text-muted uppercase">Platform Charges</span>
                                            <span className="text-rose-400">-{formatCurrency(reviewWithdrawal.platformFee)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                            <span className="text-muted uppercase">GST</span>
                                            <span className="text-rose-400">-{formatCurrency(reviewWithdrawal.gst)}</span>
                                        </div>
                                        <div className="pt-2 border-t border-surface flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-primary uppercase">Net Transfer</span>
                                            <span className="text-emerald-500">{formatCurrency(reviewWithdrawal.amount)}</span>
                                        </div>
                                    </div>
                                </div>

                                {userSnapshot && (
                                    <div className="space-y-6">
                                        {/* Payment Details */}
                                        <div className="space-y-3">
                                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-primary" /> Payment Destination
                                            </h5>
                                            <div className="p-4 bg-surface/30 border border-surface rounded-xl space-y-2">
                                                <p className="text-[10px] font-bold text-primary uppercase">{reviewWithdrawal.paymentMethod || 'Method Not Specified'}</p>
                                                {reviewWithdrawal.paymentMethod === 'bank' && reviewWithdrawal.bankDetails ? (
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-text">{reviewWithdrawal.bankDetails.accountHolderName}</p>
                                                        <p className="text-[11px] font-medium text-muted">{reviewWithdrawal.bankDetails.bankName}</p>
                                                        <p className="text-[11px] font-mono text-text">A/C: {reviewWithdrawal.bankDetails.accountNumber}</p>
                                                        <p className="text-[11px] font-mono text-text">IFSC: {reviewWithdrawal.bankDetails.ifscCode}</p>
                                                    </div>
                                                ) : reviewWithdrawal.paymentMethod === 'upi' ? (
                                                    <p className="text-sm font-bold text-text">{reviewWithdrawal.upiId}</p>
                                                ) : (
                                                    <p className="text-xs italic text-muted">No details provided</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-primary" /> Verified Identifiers
                                            </h5>
                                            <div className="p-4 bg-surface/30 border border-surface rounded-xl space-y-4">
                                                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                                                    <div className="p-2 bg-bg rounded-lg border border-surface">
                                                        <p className="text-muted uppercase mb-1">Aadhar</p>
                                                        <p className="text-text">{reviewWithdrawal.kycDetails?.aadharNumber || 'N/A'}</p>
                                                    </div>
                                                    <div className="p-2 bg-bg rounded-lg border border-surface">
                                                        <p className="text-muted uppercase mb-1">PAN</p>
                                                        <p className="text-text">{reviewWithdrawal.kycDetails?.panNumber || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <p className="text-[8px] font-bold text-muted uppercase italic">Document images are securely stored in the User's KYC Record.</p>
                                            </div>
                                        </div>

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

            {/* Custom Action Modal */}
            <AnimatePresence>
                {actionModal.show && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setActionModal({ ...actionModal, show: false })}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-md p-8 rounded-[32px] border bg-bg shadow-2xl space-y-6"
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            <div className="space-y-2 text-center">
                                <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: `var(--color-${actionModal.type === 'approve' ? 'emerald-500' : 'rose-500'})` || actionModal.color }}>
                                    {actionModal.title}
                                </h3>
                                <p className="text-xs font-bold text-muted uppercase tracking-widest">{actionModal.message}</p>
                            </div>

                            {actionModal.type === 'reject' && (
                                <textarea 
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="e.g. Account details incorrect or transaction limit reached..."
                                    className="w-full h-32 p-4 rounded-2xl border bg-surface text-sm font-bold outline-none focus:border-primary transition-all resize-none"
                                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                />
                            )}

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setActionModal({ ...actionModal, show: false })}
                                    className="flex-1 py-4 rounded-xl bg-surface border font-black text-[10px] uppercase tracking-widest hover:bg-surface2 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    disabled={(actionModal.type === 'reject' && !rejectionReason.trim()) || isLoading}
                                    onClick={() => {
                                        if (actionModal.type === 'approve') {
                                            approveWithdrawal(actionModal.id);
                                        } else {
                                            rejectWithdrawal(actionModal.id, rejectionReason);
                                        }
                                        setActionModal({ ...actionModal, show: false });
                                        setReviewWithdrawal(null);
                                    }}
                                    className={`flex-1 py-4 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg transition-all ${
                                        actionModal.type === 'approve' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'
                                    }`}
                                >
                                    {isLoading ? 'Processing...' : actionModal.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

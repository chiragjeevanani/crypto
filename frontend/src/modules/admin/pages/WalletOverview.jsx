import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet,
    CreditCard,
    Plus,
    RefreshCw,
    TrendingUp,
    ArrowDownRight,
    History,
    Search,
    Filter,
    ArrowRight
} from 'lucide-react';
import { AdminPageHeader, AdminStatCard, AdminDataTable } from '../components/shared';
import { formatCurrency } from '../utils/currency';
import { useAdminStore } from '../store/useAdminStore';
import { useNavigate } from 'react-router-dom';

const recentTransactions = [
    { id: 'TX-401', user: 'Alex_Pro', type: 'Gift Payout', amount: 450.00, status: 'Settled', date: '2m ago' },
    { id: 'TX-402', user: 'Sara_99', type: 'Campaign Reward', amount: 1200.00, status: 'Pending', date: '14m ago' },
    { id: 'TX-403', user: 'Admin_Super', type: 'Manual Adjustment', amount: -50.00, status: 'Settled', date: '1h ago' },
    { id: 'TX-404', user: 'Merchant_X', type: 'NFT Sale Comm.', amount: 84.20, status: 'Settled', date: '3h ago' },
];

export default function WalletOverview() {
    const navigate = useNavigate();
    const { ledger, settlementRails, prdMetrics, loadLedger, loadSettlementRails, computePRDMetrics, isLoading } = useAdminStore();

    useEffect(() => {
        loadLedger();
        loadSettlementRails();
        computePRDMetrics();
    }, [loadLedger, loadSettlementRails, computePRDMetrics]);
    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Financial Overview"
                subtitle="Track money flow, payouts, and settlements."
                actions={
                    <>
                        <button
                            onClick={() => loadLedger()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh Data
                        </button>
                        <button
                            onClick={() => navigate('/admin/withdrawals')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Manage Withdrawals
                        </button>
                        <button
                            onClick={() => navigate('/admin/settings/financial')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text"
                        >
                            Finance Rules
                        </button>
                    </>
                }
            />

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Main Balance Card */}
                <div className="xl:col-span-2 bg-primary border border-primary/20 rounded-lg p-6 text-black relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 rounded-lg bg-black/5 border border-black/5">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-black/50">Total Platform Vault</p>
                                <p className="text-[9px] font-mono mt-0.5 opacity-60">ID: 0x882...99a</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-4xl font-semibold tracking-tighter mb-2">{formatCurrency(1482094.20)}</h2>
                            <div className="flex items-center gap-2 text-[10px] font-semibold text-black/60 uppercase tracking-wider">
                                <TrendingUp className="w-3.5 h-3.5" />
                                +12.4% yield from last quarter
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <AdminStatCard label="Total Payouts" value={formatCurrency(42801)} change={prdMetrics ? `Processing Time ${prdMetrics.payoutLatency}` : "-2.4%"} icon={ArrowDownRight} color="emerald-500" />
                    <AdminStatCard label="Held Funds" value={formatCurrency(12400)} change={prdMetrics ? `Daily Users ${prdMetrics.dauProxy}` : "+8.1%"} icon={CreditCard} color="indigo-500" />
                </div>
            </div>

            <div className="bg-surface border border-surface rounded-lg p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-text mb-3">Performance Summary</h4>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                    <div className="p-3 rounded-lg bg-bg border border-surface text-center"><p className="text-[9px] text-muted uppercase">Daily Users</p><p className="text-sm font-bold text-text">{prdMetrics?.dauProxy || 0}</p></div>
                    <div className="p-3 rounded-lg bg-bg border border-surface text-center"><p className="text-[9px] text-muted uppercase">Avg Gifts</p><p className="text-sm font-bold text-text">{prdMetrics?.avgGiftsPerUser || 0}</p></div>
                    <div className="p-3 rounded-lg bg-bg border border-surface text-center"><p className="text-[9px] text-muted uppercase">Participation</p><p className="text-sm font-bold text-text">{prdMetrics?.campaignParticipation || 0}</p></div>
                    <div className="p-3 rounded-lg bg-bg border border-surface text-center"><p className="text-[9px] text-muted uppercase">Votes</p><p className="text-sm font-bold text-text">{prdMetrics?.voteVolume || 0}</p></div>
                    <div className="p-3 rounded-lg bg-bg border border-surface text-center"><p className="text-[9px] text-muted uppercase">Processing Time</p><p className="text-sm font-bold text-text">{prdMetrics?.payoutLatency || '--'}</p></div>
                    <div className="p-3 rounded-lg bg-bg border border-surface text-center"><p className="text-[9px] text-muted uppercase">Retention</p><p className="text-sm font-bold text-text">{prdMetrics?.brandRetentionProxy || '--'}</p></div>
                </div>
            </div>

            <div className="bg-surface border border-surface rounded-lg p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-text mb-3">Settlement Rail Health</h4>
                <div className="space-y-2">
                    {settlementRails.map((rail) => (
                        <div key={rail.id} className="flex items-center justify-between p-3 bg-bg border border-surface rounded-lg">
                            <div>
                                <p className="text-xs font-semibold text-text">{rail.name}</p>
                                <p className="text-[9px] text-muted uppercase tracking-wider">Reconciled {rail.reconciled} · Pending {rail.pending}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider border ${rail.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{rail.status}</span>
                        </div>
                    ))}
                </div>
            </div>

            <AdminDataTable
                title="Ledger Operations"
                columns={["Transaction ID", "Actor", "Module", "Amount", "Status"]}
                data={ledger.map(tx => ({
                    id: tx.id,
                    cells: [
                        <div>
                            <p className="text-xs font-mono font-medium text-text">{tx.id}</p>
                            <p className="text-[9px] text-muted font-medium uppercase tracking-wider">0x...{tx.id.split('-')[1]}</p>
                        </div>,
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-surface2 border border-surface flex items-center justify-center text-[9px] font-semibold text-text">
                                {tx.user[0]}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-text">@{tx.user}</p>
                                <p className="text-[9px] text-muted font-medium uppercase tracking-wider">{tx.date}</p>
                            </div>
                        </div>,
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{tx.type}</span>,
                        <span className={`text-xs font-semibold ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </span>,
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'Settled' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-text">{tx.status}</span>
                        </div>
                    ]
                }))}
            />

            <div className="flex items-center justify-center py-4">
                <button className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted hover:text-primary transition-all group">
                    Consolidate Ledger & Export for Tax Compliance <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}

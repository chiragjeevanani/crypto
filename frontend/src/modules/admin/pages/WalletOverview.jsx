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

const recentTransactions = [
    { id: 'TX-401', user: 'Alex_Pro', type: 'Gift Payout', amount: 450.00, status: 'Settled', date: '2m ago' },
    { id: 'TX-402', user: 'Sara_99', type: 'Campaign Reward', amount: 1200.00, status: 'Pending', date: '14m ago' },
    { id: 'TX-403', user: 'Admin_Super', type: 'Manual Adjustment', amount: -50.00, status: 'Settled', date: '1h ago' },
    { id: 'TX-404', user: 'Merchant_X', type: 'NFT Sale Comm.', amount: 84.20, status: 'Settled', date: '3h ago' },
];

export default function WalletOverview() {
    const { ledger, loadLedger, isLoading } = useAdminStore();

    useEffect(() => {
        loadLedger();
    }, [loadLedger]);
    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Financial Vault"
                subtitle="Liquidity tracking and multi-node transaction ledger oversight."
                actions={
                    <>
                        <button
                            onClick={() => loadLedger()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            Sync Ledger
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md">
                            <Plus className="w-3.5 h-3.5" />
                            Manual Adj.
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
                    <AdminStatCard label="Total Payouts" value={formatCurrency(42801)} change="-2.4%" icon={ArrowDownRight} color="emerald-500" />
                    <AdminStatCard label="Escrowed" value={formatCurrency(12400)} change="+8.1%" icon={CreditCard} color="indigo-500" />
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

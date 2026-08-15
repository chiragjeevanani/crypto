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
import { useNavigate, useSearchParams } from 'react-router-dom';

const recentTransactions = [
    { id: 'TX-401', user: 'Alex_Pro', type: 'Gift Payout', amount: 450.00, status: 'Settled', date: '2m ago' },
    { id: 'TX-402', user: 'Sara_99', type: 'Campaign Reward', amount: 1200.00, status: 'Pending', date: '14m ago' },
    { id: 'TX-403', user: 'Admin_Super', type: 'Manual Adjustment', amount: -50.00, status: 'Settled', date: '1h ago' },
    { id: 'TX-404', user: 'Merchant_X', type: 'NFT Sale Comm.', amount: 84.20, status: 'Settled', date: '3h ago' },
];

const getAssetUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    if (cleanPath.startsWith('/uploads') || cleanPath.startsWith('/avatars')) {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
        return `${baseUrl}${cleanPath}`;
    }
    return cleanPath;
};

export default function WalletOverview() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [search, setSearch] = React.useState('');
    const [type, setType] = React.useState(searchParams.get('type') || '');
    const [page, setPage] = React.useState(1);

    const { 
        financialStats, 
        transactionsData, 
        settlementRails, 
        loadFinancials, 
        loadTransactions, 
        loadSettlementRails, 
        isLoading 
    } = useAdminStore();

    useEffect(() => {
        loadFinancials();
        loadSettlementRails();
    }, [loadFinancials, loadSettlementRails]);

    useEffect(() => {
        loadTransactions({ page, search, type, limit: 10 });
    }, [loadTransactions, page, search, type]);

    const stats = [
        {
            label: 'Total Platform Revenue',
            value: formatCurrency(financialStats?.totalRevenue || 0),
            change: 'Lifetime earnings',
            icon: Wallet,
            color: 'primary',
            path: '#'
        },
        {
            label: 'Promotion Revenue',
            value: formatCurrency(financialStats?.promotionRevenue || 0),
            change: 'Ad spend volume',
            icon: TrendingUp,
            color: 'purple-500',
            path: '#'
        },
        {
            label: 'Wallet Recharges',
            value: formatCurrency(financialStats?.walletRechargeRevenue || 0),
            change: 'Direct deposits',
            icon: CreditCard,
            color: 'emerald-500',
            path: '#'
        },
        {
            label: 'Platform Commissions',
            value: formatCurrency(financialStats?.commissions || 0),
            change: 'Service fees generated',
            icon: History,
            color: 'amber-500',
            path: '#'
        },
    ];

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Financial Ecosystem"
                subtitle="High-fidelity telemetry for platform revenue and liquidity flow."
                actions={
                    <>
                        <button
                            onClick={() => { loadFinancials(); loadTransactions({ page, search, type }); }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            Sync Intelligence
                        </button>
                        <button
                            onClick={() => navigate('/admin/withdrawals')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Manage Withdrawals
                        </button>
                    </>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <AdminStatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        change={stat.change}
                        icon={stat.icon}
                        color={stat.color}
                        path={stat.path}
                        delay={i * 0.05}
                    />
                ))}
            </div>

            <div className="bg-surface border border-surface rounded-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-text">Global Ledger Operations</h4>
                        <p className="text-[9px] text-muted font-medium uppercase tracking-wider mt-1 opacity-60">Verified transactional state machine</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted group-hover:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name, email, handle..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="pl-9 pr-4 py-2 bg-bg border border-surface rounded-lg text-[10px] font-medium text-text placeholder:text-muted/50 focus:border-primary/50 transition-all w-64"
                            />
                        </div>

                        <div className="flex bg-bg border border-surface rounded-lg p-1">
                            {[
                                { id: '', label: 'All' },
                                { id: 'recharge', label: 'Recharges' },
                                { id: 'promotion', label: 'Promotions' },
                                { id: 'nft', label: 'NFT Trades' },
                                { id: 'withdrawal', label: 'Payouts' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setType(tab.id); setPage(1); }}
                                    className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
                                        type === tab.id 
                                            ? 'bg-primary text-black' 
                                            : 'text-muted hover:text-text'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-surface">
                                <th className="pb-4 text-[9px] font-bold uppercase tracking-widest text-text">Transaction Details</th>
                                <th className="pb-4 text-[9px] font-bold uppercase tracking-widest text-text text-center">Entity</th>
                                <th className="pb-4 text-[9px] font-bold uppercase tracking-widest text-text text-center">Type</th>
                                <th className="pb-4 text-[9px] font-bold uppercase tracking-widest text-text text-center">Amount</th>
                                <th className="pb-4 text-[9px] font-bold uppercase tracking-widest text-text text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface/50">
                            {transactionsData.transactions.map((tx) => {
                                const isDeposit = tx.type === 'deposit' || tx.type === 'gift_received';
                                const displayAmount = tx.amount !== null && tx.amount !== undefined ? tx.amount : tx.coins;
                                return (
                                    <tr key={tx._id} className="group hover:bg-surface2/30 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-surface2 border border-surface overflow-hidden">
                                                    {tx.userId?.avatar ? (
                                                        <img src={getAssetUrl(tx.userId.avatar)} alt={tx.userId.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted">
                                                            {tx.userId?.name ? tx.userId.name.charAt(0) : 'S'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-text group-hover:text-primary transition-colors">{tx.userId?.name || 'System Node'}</p>
                                                    <p className="text-[9px] text-muted font-medium uppercase tracking-wider">{tx.userId?.handle || 'SYSTEM'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center">
                                            <p className="text-[9px] font-mono text-muted uppercase tracking-widest">
                                                {tx._id.slice(-8).toUpperCase()}
                                            </p>
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className="px-2 py-0.5 rounded-md bg-surface2 border border-surface text-[8px] font-bold text-muted uppercase tracking-widest">
                                                {tx.referenceType === 'payment_gateway' ? 'Recharge' : 
                                                 tx.referenceType === 'post' ? 'Promotion' : 
                                                 tx.referenceType === 'nft_purchase' ? 'NFT Buy' :
                                                 tx.referenceType === 'nft_sale' ? 'NFT Sale' :
                                                 tx.referenceType === 'nft_royalty' ? 'NFT Royalty' :
                                                 tx.referenceType === 'auction_purchase' ? 'Auction Buy' :
                                                 tx.referenceType === 'auction_sale' ? 'Auction Sale' :
                                                 tx.type === 'withdrawal' ? 'Payout' : tx.type}
                                            </span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <p className={`text-xs font-black tracking-tight ${isDeposit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {isDeposit ? '+' : '-'}{formatCurrency(displayAmount)}
                                            </p>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-bold uppercase tracking-widest">
                                                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                                {tx.status}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {!isLoading && transactionsData.transactions.length === 0 && (
                        <div className="py-20 text-center">
                            <p className="text-[10px] text-muted uppercase font-bold opacity-40">No records matching the current vector</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {transactionsData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8 pt-8 border-t border-surface">
                        <p className="text-[9px] text-muted font-bold uppercase tracking-widest">
                            Page {transactionsData.page} of {transactionsData.totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-4 py-1.5 bg-surface border border-surface rounded-lg text-[9px] font-bold uppercase tracking-wider text-text hover:bg-surface2 disabled:opacity-30 transition-all"
                            >
                                Prev
                            </button>
                            <button
                                disabled={page === transactionsData.totalPages}
                                onClick={() => setPage(p => Math.min(transactionsData.totalPages, p + 1))}
                                className="px-4 py-1.5 bg-surface border border-surface rounded-lg text-[9px] font-bold uppercase tracking-wider text-text hover:bg-surface2 disabled:opacity-30 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-surface border border-surface rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-text">Settlement Rail Health</h4>
                        <p className="text-[9px] text-muted font-medium uppercase tracking-wider mt-1 opacity-60">Payout processing node status</p>
                    </div>
                    <History className="w-4 h-4 text-muted" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {settlementRails.map((rail) => (
                        <div key={rail.id} className="p-4 bg-bg border border-surface rounded-lg hover:border-primary/20 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] font-bold text-text uppercase tracking-widest">{rail.name}</p>
                                <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest ${
                                    rail.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                    {rail.status}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px]">
                                    <span className="text-muted uppercase">Reconciled</span>
                                    <span className="text-text font-bold">{rail.reconciled}</span>
                                </div>
                                <div className="flex justify-between text-[9px]">
                                    <span className="text-muted uppercase">Pending</span>
                                    <span className="text-text font-bold">{rail.pending}</span>
                                </div>
                            </div>
                            <p className="mt-4 text-[8px] text-muted font-medium uppercase tracking-wider italic text-center">Last Run: {rail.lastRun}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


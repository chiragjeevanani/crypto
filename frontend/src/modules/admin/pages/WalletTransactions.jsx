import React, { useEffect, useState } from 'react';
import { CreditCard, Search, ExternalLink, Calendar, Clock } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPageHeader, AdminDataTable } from '../components/shared';
import { formatCurrency } from '../utils/currency';

export default function WalletTransactions() {
    const { deposits, loadDeposits, isLoading } = useAdminStore();
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadDeposits();
    }, [loadDeposits]);

    // Safety check: ensure deposits is an array
    const depositsList = Array.isArray(deposits) ? deposits : [];

    const filtered = depositsList.filter(d => {
        const userName = (d.user || "").toLowerCase();
        const userEmail = (d.email || "").toLowerCase();
        const refId = (d.referenceId || "").toLowerCase();
        const searchTerm = search.toLowerCase();
        
        return userName.includes(searchTerm) || 
               userEmail.includes(searchTerm) ||
               refId.includes(searchTerm);
    });

    return (
        <div className="space-y-8 pb-20">
            <AdminPageHeader 
                title="Fiat-to-Wallet Transactions" 
                subtitle="Monetary flow auditing for all users topping up their wallet balance."
            />

            <div className="bg-surface border border-surface rounded-xl p-3 flex items-center gap-3">
                <Search className="w-4 h-4 text-muted" />
                <input 
                    type="text" 
                    placeholder="Search by username, email or reference ID..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-text"
                />
            </div>

            <AdminDataTable 
                title="Deposit Ledger"
                columns={["Date", "User Account", "Fiat Amount", "Coins Issued", "Status", "Reference"]}
                isLoading={isLoading}
                data={filtered.map(d => ({
                    id: d.id,
                    cells: [
                        <div className="flex flex-col text-[10px] font-mono text-muted">
                            <span className="flex items-center gap-1.5"><Calendar className="w-2.5 h-2.5" /> {d.date ? new Date(d.date).toLocaleDateString() : 'N/A'}</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-2.5 h-2.5" /> {d.date ? new Date(d.date).toLocaleTimeString() : 'N/A'}</span>
                        </div>,
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-text">{d.user || 'Unknown'}</span>
                            <span className="text-[9px] text-muted font-medium tracking-tight truncate max-w-[120px]">{d.email || 'No Email'}</span>
                        </div>,
                        <span className="text-sm font-bold text-emerald-500">{formatCurrency(d.amount || 0)}</span>,
                        <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                             <CreditCard className="w-3.5 h-3.5" />
                             {d.coins || 0} Coins
                        </div>,
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${d.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                             {d.status || 'Pending'}
                        </span>,
                        <div className="flex items-center gap-1 text-[10px] text-muted hover:text-text cursor-pointer">
                             <span className="font-mono truncate max-w-[80px]">{d.referenceId || "Internal Flow"}</span>
                             <ExternalLink className="w-3 h-3" />
                        </div>
                    ]
                }))}
            />
        </div>
    );
}

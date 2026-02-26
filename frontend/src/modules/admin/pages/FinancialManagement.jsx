import React, { useState } from 'react';
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
    ChevronRight
} from 'lucide-react';
import { AdminPageHeader, AdminStatCard, AdminDataTable } from '../components/shared';

const pendingWithdrawals = [
    { id: 'W-9821', user: 'Alex Rivera', amount: '$450.00', method: 'USDT (TRC20)', status: 'Pending', date: '2024-02-26 14:20' },
    { id: 'W-9822', user: 'Sarah Chen', amount: '$1,200.00', method: 'Verifying', status: 'Verifying', date: '2024-02-26 13:10' },
    { id: 'W-9823', user: 'Mike Ross', amount: '$85.00', method: 'Paypal', status: 'Pending', date: '2024-02-26 12:45' },
];

const giftAssets = [
    { id: 1, name: 'Rose', price: '10 Coins', value: '$0.10', icon: '🌹', status: 'Active' },
    { id: 2, name: 'Rocket', price: '500 Coins', value: '$5.00', icon: '🚀', status: 'Active' },
    { id: 3, name: 'Diamond', price: '1000 Coins', value: '$10.00', icon: '💎', status: 'Active' },
    { id: 4, name: 'Crown', price: '5000 Coins', value: '$50.00', icon: '👑', status: 'Inactive' },
];

export default function FinancialManagement() {
    const [commission, setCommission] = useState(15);
    const [selectedSettlement, setSelectedSettlement] = useState(null);

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Profitability Logic"
                subtitle="Monetary protocol management and asset liquidation control."
                actions={
                    <>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text">
                            <Download className="w-3.5 h-3.5" />
                            Export Ledger
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md hover:bg-primary/90 transition-all">
                            <Cpu className="w-3.5 h-3.5" />
                            Process Batch
                        </button>
                    </>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard label="Total Payouts" value="$142,801" change="+12.4%" icon={DollarSign} color="emerald-500" path="/admin/wallet" />
                <AdminStatCard label="Pending Volume" value="$4,210" change="+2.1%" icon={TrendingUp} color="amber-500" path="/admin/withdrawals" />
                <AdminStatCard label="Gift Revenue" value="$42.5k" change="+8.5%" icon={Gift} color="primary" path="/admin/gifts" />
                <AdminStatCard label="Net Commission" value="$12,400" change="+5.2%" icon={PieChart} color="indigo-500" path="/admin/financials" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Commission Setting Card */}
                <div className="bg-surface border border-surface rounded-lg p-6 xl:col-span-1 space-y-8">
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
                                <span className="text-sm font-bold text-primary">{commission}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                value={commission}
                                onChange={(e) => setCommission(e.target.value)}
                                className="w-full accent-primary h-1 bg-surface2 rounded-full appearance-none cursor-pointer"
                            />
                            <p className="text-[9px] text-muted font-medium uppercase tracking-wider mt-3 italic opacity-60">Applied to gift swaps and task rewards.</p>
                        </div>

                        <div className="pt-6 border-t border-surface/50 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] text-muted font-bold uppercase tracking-wider ml-0.5">Min Withdrawal</label>
                                <input type="text" defaultValue="$10.00" className="w-full bg-bg border border-surface rounded-lg py-2.5 px-4 font-semibold text-xs text-text outline-none focus:ring-1 focus:ring-primary/20" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-muted font-bold uppercase tracking-wider ml-0.5">Delay (Hours)</label>
                                <input type="number" defaultValue="24" className="w-full bg-bg border border-surface rounded-lg py-2.5 px-4 font-semibold text-xs text-text outline-none focus:ring-1 focus:ring-primary/20" />
                            </div>
                            <button className="w-full py-3 bg-surface2 hover:bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all mt-4">Commit Settings</button>
                        </div>
                    </div>
                </div>

                {/* Withdrawal Table */}
                <div className="xl:col-span-3">
                    <AdminDataTable
                        title="Settlement Queue"
                        columns={["ID", "Recipient", "Method", "Status", "Amount", "Actions"]}
                        onRowClick={(row) => setSelectedSettlement(pendingWithdrawals.find(w => w.id === row.id))}
                        data={pendingWithdrawals.map(w => ({
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
                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-semibold uppercase tracking-wider border ${w.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    }`}>
                                    {w.status}
                                </span>,
                                <span className="text-xs font-semibold text-emerald-500">{w.amount}</span>,
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log('Edit settlement:', w.id);
                                        }}
                                        className="p-1.5 rounded-lg bg-surface2 border border-surface hover:bg-surface hover:text-primary transition-all group/edit"
                                        title="Modify Transaction"
                                    >
                                        <Edit2 className="w-3.5 h-3.5 text-muted group-hover/edit:text-primary" />
                                    </button>
                                    <button className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all border border-emerald-500/20">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all border border-rose-500/20 font-bold">
                                        <XCircle className="w-3.5 h-3.5" />
                                    </button>
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
                    <button className="flex items-center gap-2 px-4 py-2 bg-surface2 hover:bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider text-text transition-all group">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                        Market Analysis <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {giftAssets.map((gift) => (
                        <motion.div
                            whileHover={{ y: -2 }}
                            key={gift.id}
                            className="p-5 rounded-lg bg-bg border border-surface hover:border-primary/20 transition-all group relative overflow-hidden"
                        >
                            <div className="text-2xl mb-4 grayscale group-hover:grayscale-0 transition-all duration-500">
                                {gift.icon}
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="text-xs font-bold text-text uppercase tracking-wider">{gift.name}</h4>
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider border ${gift.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-surface2 text-muted border-surface'}`}>
                                    {gift.status}
                                </span>
                            </div>
                            <div className="space-y-2 mb-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Purchase Cost</span>
                                    <span className="text-[10px] font-bold text-primary">{gift.price}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Liquidation Value</span>
                                    <span className="text-[10px] font-bold text-emerald-500">{gift.value}</span>
                                </div>
                            </div>
                            <button className="w-full py-2.5 bg-surface2 hover:bg-surface rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border border-surface text-muted hover:text-text flex items-center justify-center gap-2">
                                <Edit2 className="w-3 h-3" /> Protocol Config
                            </button>
                        </motion.div>
                    ))}

                    <button className="border border-dashed border-surface rounded-lg flex flex-col items-center justify-center p-6 text-muted hover:text-primary hover:border-primary/50 transition-all gap-2 bg-surface2/10 group">
                        <div className="w-8 h-8 rounded-lg bg-surface border border-surface flex items-center justify-center group-hover:bg-primary/10 transition-all">
                            <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Deploy Asset</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

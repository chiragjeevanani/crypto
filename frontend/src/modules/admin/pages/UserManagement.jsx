import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    BadgeCheck,
    Ban,
    ChevronRight,
    Edit2,
    Filter,
    UserPlus,
    Clock,
    ShieldCheck,
    ArrowUpRight,
    ShieldQuestion
} from 'lucide-react';
import { AdminPageHeader, AdminStatCard, AdminDataTable } from '../components/shared';

const users = [
    {
        id: 'U-7721',
        name: 'CryptoWhale_88',
        email: 'whale@crypto.com',
        status: 'Verified',
        riskScore: 'Low',
        joined: 'Jan 12, 2024',
        walletBalance: '$1,240.50',
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
        walletBalance: '$45.00',
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
        walletBalance: '$210.00',
        campaigns: 5,
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop'
    }
];

export default function UserManagement() {
    const [selectedUser, setSelectedUser] = useState(null);

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="User Intelligence"
                subtitle="Platform-wide identity management and KYC control protocols."
                actions={
                    <>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text">
                            <Filter className="w-3.5 h-3.5" />
                            Segmentation
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md">
                            <UserPlus className="w-3.5 h-3.5" />
                            Provision Identity
                        </button>
                    </>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard label="Registered" value="14,281" change="+12%" icon={Users} color="blue-500" />
                <AdminStatCard label="KYC Pass" value="8,410" change="58%" icon={BadgeCheck} color="emerald-500" />
                <AdminStatCard label="Blacklisted" value="142" change="-4" icon={Ban} color="rose-500" />
                <AdminStatCard label="Active Sessions" value="2,840" change="+240" icon={Clock} color="primary" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    <AdminDataTable
                        title="Identity Ledger"
                        columns={["Profile", "Trust Level", "Status", "Actions"]}
                        onRowClick={(user) => setSelectedUser(users.find(u => u.id === user.id))}
                        data={users.map(user => ({
                            id: user.id,
                            cells: [
                                <div className="flex items-center gap-3 text-text">
                                    <div className="w-8 h-8 rounded-lg bg-surface2 overflow-hidden border border-surface group-hover:border-primary/50 transition-all">
                                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold">@{user.name}</p>
                                        <p className="text-[9px] text-muted font-medium uppercase tracking-wider">{user.id}</p>
                                    </div>
                                </div>,
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-1 bg-bg rounded-full overflow-hidden border border-surface">
                                        <div className={`h-full ${user.riskScore === 'Low' ? 'bg-emerald-500 w-1/4' :
                                            user.riskScore === 'Medium' ? 'bg-amber-500 w-2/4' :
                                                'bg-rose-500 w-3/4'
                                            }`} />
                                    </div>
                                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">{user.riskScore}</span>
                                </div>,
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-wider border ${user.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    user.status === 'Flagged' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    }`}>
                                    {user.status}
                                </span>,
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Simulated edit redirect
                                            console.log('Redirecting to edit user:', user.id);
                                        }}
                                        className="p-1.5 bg-surface2 hover:bg-surface rounded-md transition-all border border-surface group/edit"
                                        title="Edit Identity"
                                    >
                                        <Edit2 className="w-3 h-3 text-muted group-hover/edit:text-primary" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedUser(user);
                                        }}
                                        className="p-1.5 bg-surface2 hover:bg-surface rounded-md transition-all border border-surface"
                                    >
                                        <ChevronRight className="w-3 h-3 text-muted" />
                                    </button>
                                </div>
                            ]
                        }))}
                    />
                </div>

                <div className="xl:col-span-1">
                    <AnimatePresence mode="wait">
                        {selectedUser ? (
                            <motion.div
                                key={selectedUser.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-surface border border-surface rounded-lg p-6 space-y-6 sticky top-20 shadow-xl"
                            >
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-lg bg-surface2 mx-auto mb-4 border border-surface p-1 overflow-hidden">
                                        <img src={selectedUser.avatar} className="w-full h-full object-cover rounded-md" alt="" />
                                    </div>
                                    <h3 className="text-base font-semibold tracking-tight leading-none mb-1 text-text">@{selectedUser.name}</h3>
                                    <p className="text-[9px] font-medium uppercase tracking-wider text-muted">{selectedUser.email}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-bg border border-surface rounded-lg text-center">
                                        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-1">Balance</p>
                                        <p className="text-sm font-semibold text-text">{selectedUser.walletBalance}</p>
                                    </div>
                                    <div className="p-3 bg-bg border border-surface rounded-lg text-center">
                                        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-1">Impact</p>
                                        <p className="text-sm font-semibold text-text">{selectedUser.campaigns} Tasks</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <h4 className="text-[9px] font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3" /> Mission Controls
                                    </h4>
                                    <div className="flex flex-col gap-1.5">
                                        <button className="w-full flex items-center justify-between px-4 py-2.5 bg-bg hover:bg-surface2 rounded-lg border border-surface transition-all group">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-2.5 text-text">
                                                <BadgeCheck className="w-4 h-4 text-emerald-500" /> Manual Verify
                                            </span>
                                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                                        </button>
                                        <button className="w-full flex items-center justify-between px-4 py-2.5 bg-bg hover:bg-rose-500/5 rounded-lg border border-surface transition-all group">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-500 flex items-center gap-2.5">
                                                <Ban className="w-4 h-4" /> Permanent Ban
                                            </span>
                                        </button>
                                        <button className="w-full flex items-center justify-between px-4 py-2.5 bg-bg hover:bg-amber-500/5 rounded-lg border border-surface transition-all group">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-2.5">
                                                <ShieldQuestion className="w-4 h-4" /> Mark Suspicious
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="w-full py-3 text-[9px] font-semibold uppercase tracking-wider text-muted hover:text-text transition-all"
                                >
                                    Close Intelligence View
                                </button>
                            </motion.div>
                        ) : (
                            <div className="h-full flex items-center justify-center p-12 border border-dashed border-surface rounded-lg bg-surface2/30">
                                <div className="text-center opacity-30 text-muted">
                                    <Users className="w-8 h-8 mx-auto mb-3 text-muted" />
                                    <p className="text-[9px] font-semibold uppercase tracking-wider">Selector Node Active</p>
                                    <p className="text-[9px] mt-2">Pick an identity to display detail</p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

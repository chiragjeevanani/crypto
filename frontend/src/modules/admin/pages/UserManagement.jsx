import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Info,
    History,
    Activity,
    Award,
    Vote,
    UserPlus,
    UserMinus,
    ShieldAlert
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPageHeader, AdminDataTable } from '../components/shared';
import { formatCurrency } from '../utils/currency';

export default function UserManagement() {
    const {
        usersData,
        loadUsers,
        userDetail,
        loadUserDetail,
        toggleUserBan,
        markUserSuspicious,
        verifyUserKYC,
        isLoading
    } = useAdminStore();

    const [params, setParams] = useState({
        search: '',
        role: 'all',
        status: 'all',
        kyc: 'all',
        page: 1,
        limit: 5
    });

    const [selectedId, setSelectedId] = useState(null);
    const [detailTab, setDetailTab] = useState('Overview');

    useEffect(() => {
        loadUsers(params);
    }, [loadUsers, params]);

    useEffect(() => {
        if (selectedId) {
            loadUserDetail(selectedId);
        }
    }, [selectedId, loadUserDetail]);

    const handleParamChange = (key, value) => {
        setParams(prev => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
    };

    const handleAction = async (action, id) => {
        if (confirm(`Authorize mission command: ${action}?`)) {
            if (action === 'Ban') await toggleUserBan(id);
            if (action === 'Suspicious') await markUserSuspicious(id);
            if (action === 'Verify') await verifyUserKYC(id);
            // Refresh detail if current user
            if (selectedId === id) loadUserDetail(id);
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Identity Intelligence"
                subtitle="Platform-wide identity management and KYC control protocols."
                actions={
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                            <input
                                type="text"
                                placeholder="Search ID, Name, Email..."
                                value={params.search}
                                onChange={(e) => handleParamChange('search', e.target.value)}
                                className="pl-9 pr-4 py-2 bg-surface border border-surface rounded-lg text-xs focus:ring-1 focus:ring-primary/30 outline-none text-text w-64"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-md hover:bg-primary/90 transition-all">
                            <UserPlus className="w-3.5 h-3.5" />
                            Identity Node
                        </button>
                    </div>
                }
            />

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-surface/50 border border-surface rounded-xl">
                <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Protocols:</span>
                </div>
                <select
                    value={params.role}
                    onChange={(e) => handleParamChange('role', e.target.value)}
                    className="bg-bg border border-surface rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text outline-none focus:ring-1 focus:ring-primary/20"
                >
                    <option value="all">All Roles</option>
                    <option value="VIP User">VIP User</option>
                    <option value="Standard">Standard</option>
                </select>
                <select
                    value={params.status}
                    onChange={(e) => handleParamChange('status', e.target.value)}
                    className="bg-bg border border-surface rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text outline-none focus:ring-1 focus:ring-primary/20"
                >
                    <option value="all">All Status</option>
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                    <option value="Flagged">Flagged</option>
                    <option value="Banned">Banned</option>
                </select>
                <select
                    value={params.kyc}
                    onChange={(e) => handleParamChange('kyc', e.target.value)}
                    className="bg-bg border border-surface rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text outline-none focus:ring-1 focus:ring-primary/20"
                >
                    <option value="all">All KYC</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    <AdminDataTable
                        title="Registered Identities"
                        columns={["Identity", "Role", "KYC", "Rating", "Actions"]}
                        data={usersData.users.map(user => ({
                            id: user.id,
                            cells: [
                                <div className="flex items-center gap-3">
                                    <img src={user.avatar} className="w-8 h-8 rounded-lg border border-surface" alt="" />
                                    <div>
                                        <p className="text-xs font-bold text-text">@{user.name}</p>
                                        <p className="text-[9px] text-muted font-bold uppercase">{user.id}</p>
                                    </div>
                                </div>,
                                <span className="text-[10px] font-bold text-muted uppercase">{user.role}</span>,
                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold border ${user.kycVerified ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                    {user.kycVerified ? 'VERIFIED' : 'PENDING'}
                                </span>,
                                <div className={`w-8 h-1 rounded-full ${user.riskScore === 'Low' ? 'bg-emerald-500' : user.riskScore === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'}`} />,
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setSelectedId(user.id)}
                                        className="p-1.5 bg-surface2 hover:bg-surface rounded-md border border-surface transition-all group"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-primary" />
                                    </button>
                                </div>
                            ]
                        }))}
                    />

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 bg-surface border border-surface rounded-xl">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
                            Displaying {usersData.users.length} of {usersData.total} Nodes
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={params.page === 1}
                                onClick={() => handleParamChange('page', params.page - 1)}
                                className="p-2 bg-bg border border-surface rounded-lg text-text disabled:opacity-20 hover:bg-surface2 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center px-4 bg-bg border border-surface rounded-lg text-[10px] font-bold text-text uppercase">
                                Page {params.page} / {usersData.totalPages}
                            </div>
                            <button
                                disabled={params.page === usersData.totalPages}
                                onClick={() => handleParamChange('page', params.page + 1)}
                                className="p-2 bg-bg border border-surface rounded-lg text-text disabled:opacity-20 hover:bg-surface2 transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Side Intelligence Panel */}
                <div className="xl:col-span-1">
                    <AnimatePresence mode="wait">
                        {userDetail && !isLoading ? (
                            <motion.div
                                key={userDetail.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-surface border border-surface rounded-2xl p-6 sticky top-20 shadow-2xl space-y-6 overflow-hidden"
                            >
                                {/* Header */}
                                <div className="text-center relative">
                                    <div className="w-20 h-20 rounded-2xl bg-surface2 mx-auto mb-4 border border-surface p-1 shadow-lg">
                                        <img src={userDetail.avatar} className="w-full h-full object-cover rounded-xl" alt="" />
                                    </div>
                                    <h3 className="text-base font-bold text-text leading-none mb-1">@{userDetail.name}</h3>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-[0.2em]">{userDetail.email}</p>
                                    <div className="absolute top-0 right-0">
                                        {userDetail.isSuspicious && <div className="p-1 px-2.5 bg-rose-500/10 border border-rose-500 text-rose-500 rounded-full text-[8px] font-bold animate-pulse">FLAGGED</div>}
                                    </div>
                                </div>

                                {/* Financial Snapshots */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-bg/50 border border-surface rounded-xl text-center">
                                        <p className="text-[9px] font-bold text-muted uppercase mb-1">Wallet Flow</p>
                                        <p className="text-sm font-bold text-text">{formatCurrency(userDetail.walletBalance)}</p>
                                    </div>
                                    <div className="p-4 bg-bg/50 border border-surface rounded-xl text-center">
                                        <p className="text-[9px] font-bold text-muted uppercase mb-1">Total Impact</p>
                                        <p className="text-sm font-bold text-primary">{formatCurrency(userDetail.totalEarnings)}</p>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex bg-surface2 p-1 rounded-xl border border-surface">
                                    {['Overview', 'Gifts', 'Votes', 'Tasks'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setDetailTab(t)}
                                            className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${detailTab === t ? 'bg-primary text-black' : 'text-muted hover:text-text'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="space-y-4 min-h-[160px]">
                                    {detailTab === 'Overview' && (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase border-b border-surface pb-2">
                                                <span>Mission Member Since</span>
                                                <span className="text-text">{userDetail.joined}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase border-b border-surface pb-2">
                                                <span>Protocol Status</span>
                                                <span className={userDetail.isBanned ? 'text-rose-500' : 'text-emerald-500'}>
                                                    {userDetail.isBanned ? 'BLACKLISTED' : 'ACTIVE'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase">
                                                <span>Risk Factor</span>
                                                <span className={userDetail.riskScore === 'Low' ? 'text-emerald-500' : 'text-rose-500'}>{userDetail.riskScore}</span>
                                            </div>
                                        </div>
                                    )}

                                    {detailTab === 'Gifts' && (
                                        <div className="space-y-2">
                                            {userDetail.giftHistory.map(gift => (
                                                <div key={gift.id} className="p-3 bg-bg/30 border border-surface rounded-xl flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-text">{gift.gift}</p>
                                                        <p className="text-[8px] text-muted font-bold uppercase">From: {gift.sender}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-primary">+{formatCurrency(gift.value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {detailTab === 'Votes' && (
                                        <div className="space-y-2">
                                            {userDetail.votingHistory.map(vote => (
                                                <div key={vote.id} className="p-3 bg-bg/30 border border-surface rounded-xl">
                                                    <p className="text-[10px] font-bold text-text">{vote.poll}</p>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-[8px] text-muted font-bold uppercase">{vote.date}</span>
                                                        <span className="text-[9px] font-bold text-primary uppercase">{vote.choice}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {detailTab === 'Tasks' && (
                                        <div className="space-y-2">
                                            {userDetail.campaignParticipation.map(camp => (
                                                <div key={camp.id} className="p-3 bg-bg/30 border border-surface rounded-xl flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-text">{camp.title}</p>
                                                        <span className={`text-[8px] font-bold uppercase ${camp.status === 'Claimed' ? 'text-emerald-500' : 'text-amber-500'}`}>{camp.status}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-text">+{formatCurrency(camp.reward)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Mission Controls */}
                                <div className="pt-4 border-t border-surface space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleAction('Verify', userDetail.id)}
                                            disabled={userDetail.kycVerified}
                                            className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-bold uppercase hover:bg-emerald-500/20 transition-all disabled:opacity-20"
                                        >
                                            Force Verify
                                        </button>
                                        <button
                                            onClick={() => handleAction('Suspicious', userDetail.id)}
                                            className="px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[9px] font-bold uppercase hover:bg-amber-500/20 transition-all"
                                        >
                                            Flag Fraud
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleAction('Ban', userDetail.id)}
                                        className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${userDetail.isBanned
                                                ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/20'
                                                : 'bg-rose-500 text-black border-rose-500 shadow-lg shadow-rose-500/20'
                                            }`}
                                    >
                                        {userDetail.isBanned ? 'Authorize Access' : 'Restrict Identity'}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-[500px] border border-dashed border-surface rounded-2xl bg-surface2/30 flex flex-col items-center justify-center p-8 text-center">
                                <Activity className="w-12 h-12 text-muted opacity-20 mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Awaiting Node Selection</p>
                                <p className="text-[9px] text-muted/60 mt-2 leading-relaxed uppercase">Select an identity from the ledger to retrieve deep forensic telemetry and wallet snapshots.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

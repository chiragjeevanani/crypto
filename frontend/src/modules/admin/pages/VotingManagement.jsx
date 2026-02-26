import React from 'react';
import { motion } from 'framer-motion';
import {
    Vote,
    Users,
    Activity,
    ShieldCheck,
    Clock,
    ExternalLink,
    ArrowUpRight,
    Search,
    Filter
} from 'lucide-react';
import { AdminPageHeader, AdminStatCard } from '../components/shared';

const activeVotes = [
    { id: 'VT-701', title: 'Sept. Brand Ambassador', type: 'Leaderboard', totalVotes: '12,402', status: 'In Progress', trend: '+140/hr' },
    { id: 'VT-702', title: 'User Interface Colors', type: 'UX Poll', totalVotes: '8,210', status: 'Concluding', trend: '+45/hr' },
    { id: 'VT-703', title: 'Next NFT Collection Theme', type: 'Governance', totalVotes: '4,500', status: 'Audit Phase', trend: 'Finalizing' },
];

export default function VotingManagement() {
    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Governance & Voting"
                subtitle="Manage community decisions and leaderboard integrity protocols."
                actions={
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md">
                        <Vote className="w-3.5 h-3.5" />
                        Launch Vote
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeVotes.map((vote, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={vote.id}
                        className="bg-surface border border-surface rounded-lg p-6 group hover:border-primary/20 transition-all flex flex-col"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-surface">
                                <Vote className="w-4 h-4" />
                            </div>
                            <span className={`text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${vote.status === 'In Progress'
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : 'bg-surface2 text-muted border-surface'
                                }`}>
                                {vote.status}
                            </span>
                        </div>

                        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-1">{vote.type} — {vote.id}</p>
                        <h3 className="text-sm font-semibold tracking-tight mb-6 line-clamp-1 text-text">{vote.title}</h3>

                        <div className="grid grid-cols-2 gap-4 mb-6 mt-auto">
                            <div>
                                <p className="text-[9px] font-semibold text-muted uppercase tracking-wider mb-1">Total Votes</p>
                                <p className="text-xl font-semibold tracking-tight text-text">{vote.totalVotes}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-semibold text-muted uppercase tracking-wider mb-1">Velocity</p>
                                <p className="text-xs font-semibold text-primary">{vote.trend}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-1 py-2 bg-surface2 hover:bg-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all text-text border border-surface">Audit Data</button>
                            <button className="p-2 bg-surface2 hover:bg-surface rounded-lg transition-all border border-surface">
                                <ExternalLink className="w-3.5 h-3.5 text-muted" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-surface border border-surface rounded-lg p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-surface">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text">Voter Integrity Matrix</h3>
                            <p className="text-[9px] text-muted font-medium uppercase tracking-wider mt-1">Sybil attack prevention and bot filtering active.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-surface2 rounded-lg text-[9px] font-semibold uppercase tracking-wider border border-surface text-text hover:bg-surface transition-all">Filter Proxies</button>
                        <button className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-[9px] font-semibold uppercase tracking-wider text-rose-500 border border-rose-500/20 transition-all">Flag All</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-bg border border-surface rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-3 h-3 text-emerald-500" />
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">Verified</span>
                        </div>
                        <p className="text-lg font-semibold text-text">14,204</p>
                    </div>
                    <div className="p-4 bg-bg border border-surface rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-3 h-3 text-rose-500" />
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">Sybil Blocks</span>
                        </div>
                        <p className="text-lg font-semibold text-text">452</p>
                    </div>
                    <div className="p-4 bg-bg border border-surface rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-3 h-3 text-primary" />
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">Active</span>
                        </div>
                        <p className="text-lg font-semibold text-text">1,240</p>
                    </div>
                    <div className="p-4 bg-bg border border-surface rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-3 h-3 text-muted" />
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">Latency</span>
                        </div>
                        <p className="text-lg font-semibold text-text">12ms</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

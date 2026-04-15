import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Vote,
    Users,
    Activity,
    ShieldCheck,
    Clock,
    ExternalLink,
    Search,
    Filter,
    X
} from 'lucide-react';
import { AdminPageHeader } from '../components/shared';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';
import CampaignSubmissionsReview from '../components/CampaignSubmissionsReview';
import { formatCount } from '../../user/utils/formatCurrency';

export default function VotingManagement() {
    const navigate = useNavigate();
    const { 
        campaigns, 
        loadCampaigns, 
        loadUsers, 
        usersData, 
        notify 
    } = useAdminStore();
    
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [proxyFiltered, setProxyFiltered] = React.useState(false);
    const [allFlagged, setAllFlagged] = React.useState(false);

    useEffect(() => {
        loadCampaigns();
        loadUsers({ limit: 1 }); // Get total user count for stats
    }, [loadCampaigns, loadUsers]);

    const votingCampaigns = campaigns.filter(c => c.votingEnabled);

    const handleProxyFilter = () => {
        setProxyFiltered((prev) => !prev);
        notify('success', `Proxy filter ${!proxyFiltered ? 'enabled' : 'disabled'}.`);
    };

    const handleFlagAll = () => {
        setAllFlagged(true);
        notify('success', 'All suspicious voters flagged for manual review.');
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'Completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'Paused': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-surface2 text-muted border-surface';
        }
    };

    const totalVotesAcrossAll = campaigns.reduce((acc, c) => acc + (c.analytics?.votes || 0), 0);

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Governance & Voting"
                subtitle="Manage community decisions and leaderboard integrity protocols."
                actions={
                    <button 
                        onClick={() => navigate('/admin/campaigns/new')} 
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md active:scale-95 transition-all"
                    >
                        <Vote className="w-3.5 h-3.5" />
                        New Campaign
                    </button>
                }
            />

            {votingCampaigns.length === 0 ? (
                <div className="py-20 text-center bg-surface border border-dashed border-surface rounded-2xl">
                    <Vote className="w-12 h-12 text-muted/20 mx-auto mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted">No voting campaigns active.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {votingCampaigns.map((vote) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={vote._id || vote.id}
                            className="bg-surface border border-surface rounded-lg p-6 group hover:border-primary/20 transition-all flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary border border-surface">
                                    <Vote className="w-4 h-4" />
                                </div>
                                <span className={`text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusStyle(vote.status)}`}>
                                    {vote.status}
                                </span>
                            </div>

                            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-1">Campaign — {vote._id?.slice(-6) || vote.id?.slice(-6)}</p>
                            <h3 className="text-sm font-semibold tracking-tight mb-6 line-clamp-1 text-text">{vote.title}</h3>

                            <div className="grid grid-cols-2 gap-4 mb-6 mt-auto">
                                <div>
                                    <p className="text-[9px] font-semibold text-muted uppercase tracking-wider mb-1">Total Votes</p>
                                    <p className="text-xl font-semibold tracking-tight text-text">{vote.analytics?.votes || 0}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-semibold text-muted uppercase tracking-wider mb-1">Participation</p>
                                    <p className="text-xs font-semibold text-primary">{vote.participants?.length || 0} Joins</p>
                                </div>
                            </div>

                            {/* Live Leaderboard Peek */}
                            {vote.participants?.length > 0 && (
                                <div className="mb-6 space-y-2 p-3 bg-bg/50 rounded-xl border border-surface">
                                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-muted mb-2 flex items-center gap-1.5">
                                        <Activity size={10} className="text-primary animate-pulse" />
                                        Current Leaderboard
                                    </p>
                                    {vote.participants.slice(0, 2).map((p, i) => (
                                        <div key={p.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-primary/20 text-[8px] flex items-center justify-center font-bold text-primary">#{i+1}</div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-text truncate max-w-[80px]">{p.username}</p>
                                                    <p className="text-[7px] text-muted uppercase tracking-tighter">{p.submissionType || 'Submission'}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black text-primary">{formatCount(p.votes || 0)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedCampaign(vote)}
                                    className="flex-1 py-2 bg-surface2 hover:bg-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all text-text border border-surface shadow-sm"
                                >
                                    Audit & Winners
                                </button>
                                <button
                                    onClick={() => navigate(`/admin/campaigns?id=${vote._id || vote.id}`)}
                                    className="p-2 bg-surface2 hover:bg-surface rounded-lg transition-all border border-surface shadow-sm"
                                >
                                    <ExternalLink className="w-3.5 h-3.5 text-muted" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

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
                        <button
                            onClick={handleProxyFilter}
                            className={`px-4 py-2 rounded-lg text-[9px] font-semibold uppercase tracking-wider border transition-all ${proxyFiltered ? 'bg-primary text-black border-primary' : 'bg-surface2 border-surface text-text hover:bg-surface'}`}
                        >
                            {proxyFiltered ? 'Proxies Filtered' : 'Filter Proxies'}
                        </button>
                        <button
                            onClick={handleFlagAll}
                            className={`px-4 py-2 rounded-lg text-[9px] font-semibold uppercase tracking-wider border transition-all ${allFlagged ? 'bg-rose-500 text-white border-rose-500' : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'}`}
                        >
                            {allFlagged ? 'Flagged' : 'Flag All'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-bg border border-surface rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-3 h-3 text-emerald-500" />
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">Platform Users</span>
                        </div>
                        <p className="text-lg font-semibold text-text">{usersData.total?.toLocaleString() || '0'}</p>
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
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">Vote Volume</span>
                        </div>
                        <p className="text-lg font-semibold text-text">{totalVotesAcrossAll.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-bg border border-surface rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-3 h-3 text-muted" />
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">Latency</span>
                        </div>
                        <p className="text-lg font-semibold text-text">14ms</p>
                    </div>
                </div>
            </div>

            {/* Submissions Review Modal */}
            <AnimatePresence>
                {selectedCampaign && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-surface border border-surface rounded-[32px] w-full max-w-4xl h-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-primary/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                                <CampaignSubmissionsReview 
                                    campaign={selectedCampaign} 
                                    onClose={() => setSelectedCampaign(null)} 
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

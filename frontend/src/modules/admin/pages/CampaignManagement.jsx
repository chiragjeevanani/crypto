import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Target,
    Pause,
    Edit2,
    TrendingUp,
    Activity,
    Award,
    Trophy,
    Users,
    ChevronRight,
    ShieldCheck,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminPageHeader, AdminStatCard, AdminDataTable } from '../components/shared';
import { formatCurrency } from '../utils/currency';
import { useAdminStore } from '../store/useAdminStore';

const getProgress = (startDate, endDate) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    if (!start || !end || Number.isNaN(start) || Number.isNaN(end)) return 0;
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
};

import CampaignSubmissionsReview from '../components/CampaignSubmissionsReview';

export default function CampaignManagement() {
    const { campaigns, campaignClosures, loadCampaigns, setCampaignStatus, linkCampaignClosureAudit, deleteCampaign, declareCampaignWinners, markCampaignRewardDistributed } = useAdminStore();
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [showSubmissionsReview, setShowSubmissionsReview] = useState(false);
    const [winnerList, setWinnerList] = useState([]);
    const [loadingWinners, setLoadingWinners] = useState(false)
        const navigate = useNavigate();

    useEffect(() => {
        loadCampaigns();
    }, [loadCampaigns]);


    const handleSuspend = (id) => {
        if (window.confirm('Broadcast suspension to all nodes? This will halt participant engagement.')) {
            setCampaignStatus(id, 'Paused');
        }
    };

    const handleResume = (id) => {
        setCampaignStatus(id, 'Active');
    };

    const handleDeclareWinners = async (id) => {
        setLoadingWinners(true)
        try {
            const winners = await declareCampaignWinners(id)
            setWinnerList(winners || [])
        } finally {
            setLoadingWinners(false)
        }
    }

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Brand Campaigns"
                subtitle="Create and manage reward campaigns for users."
                actions={
                    <button
                        onClick={() => navigate('/admin/campaigns/new')}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-black rounded-lg font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-md"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Create Campaign
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard label="Live Campaigns" value={campaigns.filter(c => c.status === 'Active').length.toString()} change="Active" icon={Activity} color="primary" />
                <AdminStatCard label="Reward Pool" value={formatCurrency(campaigns.reduce((acc, c) => acc + (Number(c.rewardAmount || c.budget || 0) || 0), 0))} change="Total" icon={Trophy} color="amber-500" />
                <AdminStatCard label="Participants" value={campaigns.reduce((acc, c) => acc + (c.participants?.length || c.participants || 0), 0).toLocaleString()} change="Total" icon={Users} color="blue-500" />
                <AdminStatCard label="Audit Linked" value={`${campaignClosures.filter(c => c.auditLinked).length}/${campaignClosures.length}`} change="Winner Logs" icon={Award} color="emerald-500" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    <AdminDataTable
                        title="Campaign List"
                        columns={["Campaign", "Allocation", "Progress", "Status", "Actions"]}
                        onRowClick={(camp) => setSelectedCampaign(campaigns.find(c => (c._id || c.id) === camp.id))}
                        data={campaigns.map(camp => ({
                            id: camp._id || camp.id,
                            cells: [
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-primary/10 text-primary border border-primary/20`}>
                                        <Target className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-text truncate max-w-[150px]">{camp.title}</p>
                                        <p className="text-[9px] text-muted font-bold uppercase tracking-wider">{camp.brandName || camp.brand}</p>
                                    </div>
                                </div>,
                                <span className="text-[10px] font-bold text-text">{camp.rewardDetails || formatCurrency(Number(camp.budget || 0))}</span>,
                                <div className="w-24 space-y-1.5">
                                    <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter">
                                        <span className="text-muted">{(camp.participants?.length || camp.participants || 0)} Participants</span>
                                        <span className="text-text">{getProgress(camp.startDate, camp.endDate)}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-bg rounded-full overflow-hidden border border-surface">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${getProgress(camp.startDate, camp.endDate)}%` }} className="h-full bg-primary" />
                                    </div>
                                </div>,
                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold border uppercase tracking-widest ${camp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    camp.status === 'Paused' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                        'bg-surface2 text-muted border-surface'
                                    }`}>
                                    {camp.status}
                                </span>,
                                <div className="flex items-center gap-2">
                                    <button
                                        className="p-1.5 bg-surface2 hover:bg-surface rounded-md border border-surface transition-all group/edit"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/admin/campaigns/edit/${camp._id || camp.id}`);
                                        }}
                                    >
                                        <Edit2 className="w-3 h-3 text-muted group-hover/edit:text-primary" />
                                    </button>
                                    <button
                                        className="p-1.5 bg-surface2 hover:bg-surface rounded-md border border-surface transition-all group"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('Delete this campaign?')) {
                                                deleteCampaign(camp._id || camp.id);
                                            }
                                        }}
                                    >
                                        <X className="w-3 h-3 text-muted group-hover:text-rose-500" />
                                    </button>
                                    <button className="p-1.5 bg-surface2 hover:bg-surface rounded-md border border-surface transition-all group">
                                        <ChevronRight className="w-3 h-3 text-muted group-hover:text-primary" />
                                    </button>
                                </div>
                            ]
                        }))}
                    />
                </div>

                <div className="hidden xl:block xl:col-span-1">
                    <AnimatePresence mode="wait">
                        {selectedCampaign ? (
                            <motion.div
                                key={selectedCampaign._id || selectedCampaign.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-surface border border-surface rounded-lg p-6 space-y-6 sticky top-20 shadow-xl"
                            >
                                <div className="p-4 bg-bg border border-surface rounded-lg">
                                    <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted mb-4 flex items-center gap-2">
                                        <Activity className="w-3 h-3 text-primary" /> Activity Trend
                                    </h4>
                                    <div className="h-32 flex items-end justify-around gap-1">
                                        {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                                            <div key={i} className="flex-1 bg-primary/10 rounded-t-sm relative group">
                                                <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} className="absolute bottom-0 inset-x-0 bg-primary/40 group-hover:bg-primary transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> Trust Metrics
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-bg border border-surface rounded-lg">
                                            <p className="text-[9px] font-bold text-muted uppercase mb-1">Authentic</p>
                                            <p className="text-base font-bold text-emerald-500">92%</p>
                                        </div>
                                        <div className="p-3 bg-bg border border-surface rounded-lg">
                                            <p className="text-[9px] font-bold text-muted uppercase mb-1">Collisions</p>
                                            <p className="text-base font-bold text-rose-500">12</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                                        <TrendingUp className="w-3 h-3 text-primary" /> Campaign Analytics
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-bg border border-surface rounded-lg">
                                            <p className="text-[9px] font-bold text-muted uppercase mb-1">Impressions</p>
                                            <p className="text-base font-bold text-text">{selectedCampaign.analytics?.impressions || 0}</p>
                                        </div>
                                        <div className="p-3 bg-bg border border-surface rounded-lg">
                                            <p className="text-[9px] font-bold text-muted uppercase mb-1">Clicks</p>
                                            <p className="text-base font-bold text-text">{selectedCampaign.analytics?.clicks || 0}</p>
                                        </div>
                                        <div className="p-3 bg-bg border border-surface rounded-lg">
                                            <p className="text-[9px] font-bold text-muted uppercase mb-1">Submissions</p>
                                            <p className="text-base font-bold text-text">{selectedCampaign.analytics?.submissions || 0}</p>
                                        </div>
                                        <div className="p-3 bg-bg border border-surface rounded-lg">
                                            <p className="text-[9px] font-bold text-muted uppercase mb-1">Votes</p>
                                            <p className="text-base font-bold text-text">{selectedCampaign.analytics?.votes || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 space-y-2">
                                    <button
                                        onClick={() => navigate(`/admin/campaigns/edit/${selectedCampaign._id || selectedCampaign.id}`)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-primary text-black rounded-lg font-bold uppercase tracking-widest text-[9px] shadow-sm active:scale-[0.98] transition-all"
                                    >
                                        Edit Campaign <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeclareWinners(selectedCampaign._id || selectedCampaign.id)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bg hover:bg-emerald-500/5 text-muted hover:text-emerald-500 rounded-lg border border-surface transition-all font-bold uppercase tracking-widest text-[9px]"
                                    >
                                        {loadingWinners ? 'Declaring...' : 'Declare Winners'}
                                    </button>
                                    {selectedCampaign.status === 'Active' ? (
                                        <button
                                            onClick={() => handleSuspend(selectedCampaign._id || selectedCampaign.id)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bg hover:bg-rose-500/5 text-muted hover:text-rose-500 rounded-lg border border-surface transition-all font-bold uppercase tracking-widest text-[9px]"
                                        >
                                            <Pause className="w-3.5 h-3.5" /> Pause Campaign
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleResume(selectedCampaign._id || selectedCampaign.id)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bg hover:bg-emerald-500/5 text-muted hover:text-emerald-500 rounded-lg border border-surface transition-all font-bold uppercase tracking-widest text-[9px]"
                                        >
                                            <Activity className="w-3.5 h-3.5" /> Resume Campaign
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => setSelectedCampaign(null)}
                                    className="w-full text-center text-[9px] font-bold uppercase tracking-[0.2em] text-muted hover:text-text transition-all pt-2"
                                >
                                    Close Details
                                </button>

                                <div className="pt-4 border-t border-surface space-y-3">
                                    <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                                        <Users className="w-3 h-3" /> Participation Control
                                    </h4>
                                    <button
                                        onClick={() => setShowSubmissionsReview(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bg hover:bg-surface2 rounded-lg border border-surface transition-all font-bold uppercase tracking-widest text-[9px] text-text"
                                    >
                                        Review Submissions
                                    </button>
                                </div>

                                {showSubmissionsReview && (
                                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
                                        <motion.div 
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="bg-surface border border-surface rounded-[32px] w-full max-w-4xl h-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-primary/10"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                                <CampaignSubmissionsReview 
                                                    campaign={selectedCampaign} 
                                                    onClose={() => setShowSubmissionsReview(false)} 
                                                />
                                            </div>
                                        </motion.div>
                                    </div>
                                )}

                                {winnerList.length > 0 && (
                                    <div className="pt-4 border-t border-surface space-y-2">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Winners</p>
                                        {winnerList.map((winner) => (
                                            <div key={winner._id || winner.id} className="flex items-center justify-between text-[10px]">
                                                <span className="text-text">{winner.user?.handle || winner.user?.name || 'Winner'}</span>
                                                <button
                                                    onClick={() => markCampaignRewardDistributed(selectedCampaign._id || selectedCampaign.id, winner._id || winner.id)}
                                                    className="px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                >
                                                    Rewarded
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </div>

            <div className="bg-surface border border-surface rounded-lg p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-text mb-4">Voting Winners & Payout Closures</h3>
                <div className="space-y-3">
                    {campaignClosures.length === 0 && (
                        <div className="p-4 rounded-lg bg-bg border border-surface text-[10px] text-muted uppercase tracking-wider">
                            No completed campaign closures yet.
                        </div>
                    )}
                    {campaignClosures.map((closure) => (
                        <div key={closure.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-bg border border-surface">
                            <div>
                                <p className="text-xs font-semibold text-text">{closure.title}</p>
                                <p className="text-[9px] text-muted uppercase tracking-wider">
                                    Winner: {closure.winner} · Payout: {formatCurrency(closure.payout)}
                                </p>
                            </div>
                            <button
                                onClick={() => linkCampaignClosureAudit(closure.id)}
                                disabled={closure.auditLinked}
                                className={`self-start sm:self-auto px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${closure.auditLinked
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                                    }`}
                            >
                                {closure.auditLinked ? 'Linked' : 'Link Audit + Payout'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

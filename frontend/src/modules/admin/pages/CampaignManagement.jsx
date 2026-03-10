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

const campaigns = [
    {
        id: 'C-101',
        title: 'Summer Splash Brand Task',
        brand: 'Pepsi Co',
        budget: 5000,
        participants: 1240,
        status: 'Active',
        endDate: 'Sep 12, 2026',
        progress: 65,
        color: 'emerald-500'
    },
    {
        id: 'C-102',
        title: 'Eco-Friendly Challenge',
        brand: 'Green Earth',
        budget: 2500,
        participants: 850,
        status: 'Paused',
        endDate: 'Oct 05, 2026',
        progress: 30,
        color: 'amber-500'
    },
    {
        id: 'C-103',
        title: 'New App Review Blast',
        brand: 'TechVibe',
        budget: 10000,
        participants: 4500,
        status: 'Active',
        endDate: 'Aug 28, 2026',
        progress: 92,
        color: 'primary'
    }
];

export default function CampaignManagement() {
    const { campaigns, campaignClosures, loadCampaigns, setCampaignStatus, linkCampaignClosureAudit } = useAdminStore();
    const [selectedCampaign, setSelectedCampaign] = useState(null);
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
                <AdminStatCard label="Live Campaigns" value={campaigns.filter(c => c.status === 'Active').length.toString()} change="+2" icon={Activity} color="primary" />
                <AdminStatCard label="Reward Pool" value={formatCurrency(84200)} change="USDT" icon={Trophy} color="amber-500" />
                <AdminStatCard label="Participants" value="42.8k" change="+1.2k" icon={Users} color="blue-500" />
                <AdminStatCard label="Audit Linked" value={`${campaignClosures.filter(c => c.auditLinked).length}/${campaignClosures.length}`} change="Winner Logs" icon={Award} color="emerald-500" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    <AdminDataTable
                        title="Campaign List"
                        columns={["Campaign", "Allocation", "Progress", "Status", "Actions"]}
                        onRowClick={(camp) => setSelectedCampaign(campaigns.find(c => c.id === camp.id))}
                        data={campaigns.map(camp => ({
                            id: camp.id,
                            cells: [
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-${camp.color}/10 text-${camp.color} border border-${camp.color}/20`}>
                                        <Target className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-text truncate max-w-[150px]">{camp.title}</p>
                                        <p className="text-[9px] text-muted font-bold uppercase tracking-wider">{camp.brand}</p>
                                    </div>
                                </div>,
                                <span className="text-[10px] font-bold text-text">{formatCurrency(camp.budget)}</span>,
                                <div className="w-24 space-y-1.5">
                                    <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter">
                                        <span className="text-muted">{camp.participants} Participants</span>
                                        <span className="text-text">{camp.progress}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-bg rounded-full overflow-hidden border border-surface">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${camp.progress}%` }} className={`h-full bg-${camp.color}`} />
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
                                            navigate(`/admin/campaigns/edit/${camp.id}`);
                                        }}
                                    >
                                        <Edit2 className="w-3 h-3 text-muted group-hover/edit:text-primary" />
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
                                key={selectedCampaign.id}
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

                                <div className="pt-2 space-y-2">
                                    <button
                                        onClick={() => navigate(`/admin/campaigns/edit/${selectedCampaign.id}`)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-primary text-black rounded-lg font-bold uppercase tracking-widest text-[9px] shadow-sm active:scale-[0.98] transition-all"
                                    >
                                        Edit Campaign <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                    {selectedCampaign.status === 'Active' ? (
                                        <button
                                            onClick={() => handleSuspend(selectedCampaign.id)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bg hover:bg-rose-500/5 text-muted hover:text-rose-500 rounded-lg border border-surface transition-all font-bold uppercase tracking-widest text-[9px]"
                                        >
                                            <Pause className="w-3.5 h-3.5" /> Pause Campaign
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleResume(selectedCampaign.id)}
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

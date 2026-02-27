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
    const { campaigns, loadCampaigns, setCampaignStatus, isLoading } = useAdminStore();
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', brand: '', budget: '', endDate: '' });
    const navigate = useNavigate();

    useEffect(() => {
        loadCampaigns();

        // Handle direct action from sidebar
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'create') {
            setCreateModalOpen(true);
        }
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
                title="Brand Mandates"
                subtitle="Design and oversee high-impact reward campaigns and brand initiatives."
                actions={
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-black rounded-lg font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-md"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Deploy Protocol
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard label="Live Mandates" value="12" change="+2" icon={Activity} color="primary" />
                <AdminStatCard label="Liquidity Pool" value={formatCurrency(84200)} change="USDT" icon={Trophy} color="amber-500" />
                <AdminStatCard label="Node Traffic" value="42.8k" change="+1.2k" icon={Users} color="blue-500" />
                <AdminStatCard label="Success Ratio" value="78%" change="High" icon={Award} color="emerald-500" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    <AdminDataTable
                        title="Mandate Registry"
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

                <div className="xl:col-span-1">
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
                                        <Activity className="w-3 h-3 text-primary" /> Telemetry Flux
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
                                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> Integrity Metrics
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
                                        Command Center <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                    {selectedCampaign.status === 'Active' ? (
                                        <button
                                            onClick={() => handleSuspend(selectedCampaign.id)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bg hover:bg-rose-500/5 text-muted hover:text-rose-500 rounded-lg border border-surface transition-all font-bold uppercase tracking-widest text-[9px]"
                                        >
                                            <Pause className="w-3.5 h-3.5" /> Suspend Protocol
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleResume(selectedCampaign.id)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bg hover:bg-emerald-500/5 text-muted hover:text-emerald-500 rounded-lg border border-surface transition-all font-bold uppercase tracking-widest text-[9px]"
                                        >
                                            <Activity className="w-3.5 h-3.5" /> Resume Protocol
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => setSelectedCampaign(null)}
                                    className="w-full text-center text-[9px] font-bold uppercase tracking-[0.2em] text-muted hover:text-text transition-all pt-2"
                                >
                                    Exit Analysis View
                                </button>
                            </motion.div>
                        ) : (
                            <div className="h-[400px] border border-dashed border-surface rounded-lg bg-surface2/30 flex items-center justify-center p-8">
                                <div className="text-center opacity-20 text-muted">
                                    <Trophy className="w-10 h-10 mx-auto mb-4 text-text" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Mandate Selection Active</p>
                                    <p className="text-[10px] mt-2 max-w-[180px] mx-auto font-medium">Select a protocol from the registry to inspect real-time performance flux.</p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {/* Campaign Creation Modal */}
            <AnimatePresence>
                {createModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-surface border border-surface w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-surface flex justify-between items-center bg-surface2/50">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-text">Initialize Protocol</h3>
                                <button onClick={() => setCreateModalOpen(false)} className="text-muted hover:text-text transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <form className="p-6 space-y-5" onSubmit={(e) => { e.preventDefault(); alert('Protocol deployment initiated to network clusters.'); setCreateModalOpen(false); }}>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Mandate Title</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Summer Brand Awareness"
                                        className="w-full bg-bg border border-surface rounded-lg p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/20 text-text"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Brand Identity</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Company Name"
                                        className="w-full bg-bg border border-surface rounded-lg p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/20 text-text"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Allocation (USDT)</label>
                                        <input
                                            required
                                            type="number"
                                            className="w-full bg-bg border border-surface rounded-lg p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/20 text-text"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Protocol Expiry</label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full bg-bg border border-surface rounded-lg p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/20 text-text"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setCreateModalOpen(false)}
                                        className="flex-1 py-3 bg-bg border border-surface rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted hover:text-text transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-3 bg-primary text-black rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all font-bold"
                                    >
                                        Deploy Protocol
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

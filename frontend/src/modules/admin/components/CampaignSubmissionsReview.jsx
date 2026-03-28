import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    FileText, 
    Image as ImageIcon, 
    User, 
    Vote, 
    Trophy, 
    CheckCircle2,
    Eye,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { formatCount } from '../../user/utils/formatCurrency';

export default function CampaignSubmissionsReview({ campaign, onClose }) {
    const { loadCampaignSubmissions, declareCampaignWinners } = useAdminStore();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProofs, setExpandedProofs] = useState({});

    useEffect(() => {
        if (campaign) {
            const fetch = async () => {
                setLoading(true);
                try {
                    const data = await loadCampaignSubmissions(campaign._id || campaign.id);
                    setSubmissions(data || []);
                } finally {
                    setLoading(false);
                }
            };
            fetch();
        }
    }, [campaign, loadCampaignSubmissions]);

    const toggleProofs = (id) => {
        setExpandedProofs(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Fetching proof of purchases...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-surface pb-4">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text">Submissions Review</h3>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider mt-1">{campaign.title} · {submissions.length} Entries</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-surface2 rounded-full transition-colors text-muted">
                    <X size={18} />
                </button>
            </div>

            {submissions.length === 0 ? (
                <div className="text-center py-12 bg-bg border border-dashed border-surface rounded-xl">
                    <FileText className="mx-auto text-muted/20 mb-3" size={32} />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted">No submissions found for this campaign.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {submissions.map((sub) => (
                        <div key={sub._id || sub.id} className="bg-bg border border-surface rounded-2xl overflow-hidden shadow-sm flex flex-col">
                            {/* User Header */}
                            <div className="p-4 border-b border-surface flex items-center justify-between bg-surface/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full border border-primary/20 bg-primary/10 overflow-hidden">
                                        <img src={sub.user?.avatar} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-text">{sub.user?.name || 'User'}</p>
                                        <p className="text-[9px] text-muted font-bold uppercase tracking-widest">@{sub.user?.handle || 'handle'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                    <Vote size={12} className="text-primary" />
                                    <span className="text-[11px] font-black text-primary">{formatCount(sub.votes || 0)}</span>
                                </div>
                            </div>

                            {/* Main Creative (Reel) */}
                            <div className="relative aspect-[3/4] bg-zinc-950">
                                {sub.reel?.url ? (
                                    <video 
                                        src={sub.reel.url} 
                                        className="w-full h-full object-cover" 
                                        controls
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted/20">
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                                {sub.isWinner && (
                                    <div className="absolute top-4 right-4 bg-emerald-500 text-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border-2 border-emerald-400">
                                        <Trophy size={12} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">WINNER</span>
                                    </div>
                                )}
                            </div>

                            {/* Caption Footer */}
                            <div className="p-4 bg-surface/10">
                                <p className="text-[11px] text-text leading-relaxed line-clamp-2 italic">"{sub.caption || 'No caption provided'}"</p>
                            </div>

                            {/* Verification Proofs Section */}
                            <div className="border-t border-surface">
                                <button 
                                    onClick={() => toggleProofs(sub._id || sub.id)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface2 transition-colors group"
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={14} className={expandedProofs[sub._id || sub.id] ? 'text-primary' : 'text-muted'} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-text group-hover:text-primary transition-colors">
                                            Verification Proofs
                                        </span>
                                    </div>
                                    {expandedProofs[sub._id || sub.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                <AnimatePresence>
                                    {expandedProofs[sub._id || sub.id] && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden bg-bg/50 px-4 pb-4"
                                        >
                                            <div className="grid grid-cols-3 gap-3 mt-2">
                                                <div className="space-y-1.5">
                                                    <p className="text-[8px] font-bold uppercase tracking-wider text-muted text-center">Bill Copy</p>
                                                    <div className="aspect-square rounded-lg border border-surface bg-black overflow-hidden group/proof cursor-zoom-in relative">
                                                        <img src={sub.billImage} alt="Bill" className="w-full h-full object-cover opacity-80 group-hover/proof:opacity-100 transition-opacity" crossOrigin="anonymous" />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/proof:opacity-100 transition-opacity bg-black/40">
                                                            <Eye size={16} className="text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="text-[8px] font-bold uppercase tracking-wider text-muted text-center">Product</p>
                                                    <div className="aspect-square rounded-lg border border-surface bg-black overflow-hidden group/proof cursor-zoom-in relative">
                                                        <img src={sub.productImage} alt="Product" className="w-full h-full object-cover opacity-80 group-hover/proof:opacity-100 transition-opacity" crossOrigin="anonymous" />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/proof:opacity-100 transition-opacity bg-black/40">
                                                            <Eye size={16} className="text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="text-[8px] font-bold uppercase tracking-wider text-muted text-center">Selfie</p>
                                                    <div className="aspect-square rounded-lg border border-surface bg-black overflow-hidden group/proof cursor-zoom-in relative">
                                                        <img src={sub.userSelfie} alt="Selfie" className="w-full h-full object-cover opacity-80 group-hover/proof:opacity-100 transition-opacity" crossOrigin="anonymous" />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/proof:opacity-100 transition-opacity bg-black/40">
                                                            <Eye size={16} className="text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

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
    ChevronUp,
    ShieldCheck
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { formatCount } from '../../user/utils/formatCurrency';

export default function CampaignSubmissionsReview({ campaign, onClose }) {
    const { loadCampaignSubmissions, declareCampaignWinners, verifyCampaignSubmission } = useAdminStore();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleVerify = async (submissionId, isVerified) => {
        try {
            const updated = await verifyCampaignSubmission(campaign._id || campaign.id, submissionId, isVerified);
            setSubmissions(prev => prev.map(s => (s._id || s.id) === submissionId ? { ...s, isVerified: updated.isVerified } : s));
        } catch (err) {
            console.error("Verification failed", err);
        }
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
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text">Campaign Intelligence Hub</h3>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider mt-1">{campaign.title} · {submissions.length} Entries Ready for Audit</p>
                </div>
                <div className="flex items-center gap-3">
                    {campaign.status !== 'Completed' && submissions.length > 0 && (
                        <button 
                            onClick={async () => {
                                if (window.confirm('Declare winners based on current vote leaderboard?')) {
                                    await declareCampaignWinners(campaign._id || campaign.id);
                                    onClose();
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                            <Trophy size={14} />
                            Declare Winners
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-surface2 rounded-full transition-colors text-muted">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {submissions.length === 0 ? (
                <div className="text-center py-12 bg-bg border border-dashed border-surface rounded-xl">
                    <FileText className="mx-auto text-muted/20 mb-3" size={32} />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted">No submissions found for this campaign.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {submissions.map((sub) => (
                        <div key={sub._id || sub.id} className="bg-bg border border-surface rounded-3xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-2">
                            {/* Left Side: Creative & Identity */}
                            <div className="flex flex-col border-r border-surface">
                                <div className="p-5 border-b border-surface flex items-center justify-between bg-surface/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-primary/10 overflow-hidden shrink-0">
                                            <img src={sub.user?.avatar} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-text">{sub.user?.name || 'User'}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[9px] text-muted font-bold uppercase tracking-widest">@{sub.user?.handle || 'handle'}</p>
                                                <span className="w-1 h-1 rounded-full bg-muted/30" />
                                                <p className="text-[8px] text-muted font-bold uppercase tracking-widest">{new Date(sub.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                        <Vote size={12} className="text-primary" />
                                        <span className="text-[11px] font-black text-primary">{formatCount(sub.votes || 0)}</span>
                                    </div>
                                </div>

                                <div className="relative aspect-[4/5] bg-zinc-950">
                                    {sub.reel?.url ? (
                                        sub.reel.type === 'video' ? (
                                            <video src={sub.reel.url} className="w-full h-full object-cover" controls crossOrigin="anonymous" />
                                        ) : (
                                            <img src={sub.reel.url} className="w-full h-full object-cover" alt="Submission" crossOrigin="anonymous" />
                                        )
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted/20">
                                            <ImageIcon size={48} />
                                        </div>
                                    )}
                                    {sub.isWinner && (
                                        <div className="absolute top-4 right-4 bg-emerald-500 text-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border-2 border-emerald-400 z-10">
                                            <Trophy size={12} />
                                            <span className="text-[10px] font-black uppercase tracking-wider">WINNER</span>
                                        </div>
                                    )}
                                    {sub.isVerified && (
                                        <div className="absolute top-4 left-4 bg-primary text-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border-2 border-primary/50 z-10">
                                            <CheckCircle2 size={12} />
                                            <span className="text-[10px] font-black uppercase tracking-wider">AUTHENTICATED</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 bg-surface/5 flex-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Campaign Narrative</h4>
                                    <p className="text-xs text-text leading-relaxed font-medium">"{sub.caption || 'No caption provided'}"</p>
                                </div>
                            </div>

                            {/* Right Side: Verification Deck & Moderation */}
                            <div className="flex flex-col bg-surface/10">
                                <div className="p-5 border-b border-surface">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                        <ShieldCheck size={14} /> VERIFICATION AUDIT DECK
                                    </h4>
                                </div>

                                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted flex justify-between items-center">
                                                <span>Proof of Purchase (Bill)</span>
                                                <FileText size={12} className="opacity-40" />
                                            </p>
                                            <div className="aspect-[16/10] rounded-2xl border border-surface bg-black overflow-hidden group/proof cursor-zoom-in relative shadow-inner">
                                                <img src={sub.billImage} alt="Bill" className="w-full h-full object-cover opacity-90 group-hover/proof:opacity-100 transition-opacity" crossOrigin="anonymous" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/proof:opacity-100 transition-opacity bg-black/40">
                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full border border-white/20">Expand Audit Image</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Product Unit</p>
                                                <div className="aspect-square rounded-2xl border border-surface bg-black overflow-hidden group/proof cursor-zoom-in relative">
                                                    <img src={sub.productImage} alt="Product" className="w-full h-full object-cover opacity-90 group-hover/proof:opacity-100 transition-opacity" crossOrigin="anonymous" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Liveness Selfie</p>
                                                <div className="aspect-square rounded-2xl border border-surface bg-black overflow-hidden group/proof cursor-zoom-in relative border-primary/20 shadow-lg shadow-primary/5">
                                                    <img src={sub.userSelfie} alt="Selfie" className="w-full h-full object-cover opacity-90 group-hover/proof:opacity-100 transition-opacity" crossOrigin="anonymous" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-bg border-t border-surface space-y-3">
                                    <div className="flex gap-3">
                                        {!sub.isVerified ? (
                                            <button 
                                                onClick={() => handleVerify(sub._id || sub.id, true)}
                                                className="flex-1 py-3.5 bg-primary text-black rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                                            >
                                                <CheckCircle2 size={16} /> Approve Submission
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleVerify(sub._id || sub.id, false)}
                                                className="flex-1 py-3.5 bg-surface text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] border border-rose-500/20 hover:bg-rose-500/5 transition-all flex items-center justify-center gap-2"
                                            >
                                                <X size={16} /> Revoke Approval
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[8px] text-center text-muted uppercase tracking-widest font-bold opacity-60">Verification decision is logged and timestamped</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    Image as ImageIcon,
    ExternalLink,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
    Hash,
    MoreHorizontal,
    Ban,
    History,
    Search,
    MessageSquareX
} from 'lucide-react';
import { AdminPageHeader } from '../components/shared';

const initialNfts = [
    {
        id: 'NFT-901',
        name: 'CyberPunk #442',
        creator: 'PixelArtist',
        collection: 'CyberVibe',
        originalityScore: '98%',
        status: 'pending',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&h=500&fit=crop',
        history: [{ date: '2024-02-26 10:00', action: 'Submission created by PixelArtist' }]
    },
    {
        id: 'NFT-902',
        name: 'Neon Skater',
        creator: 'StreetArt_X',
        collection: 'UrbanLegends',
        originalityScore: '42%',
        status: 'pending',
        image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=500&h=500&fit=crop',
        history: [{ date: '2024-02-26 11:30', action: 'Submission created by StreetArt_X' }]
    },
    {
        id: 'NFT-903',
        name: 'Golden Ape',
        creator: 'CryptoKing',
        collection: 'RareApes',
        originalityScore: '100%',
        status: 'approved',
        image: 'https://images.unsplash.com/photo-1621619856624-42fd193a0661?w=500&h=500&fit=crop',
        history: [
            { date: '2024-02-20 09:00', action: 'Submission created by CryptoKing' },
            { date: '2024-02-21 14:00', action: 'Approved by SuperAdmin' },
            { date: '2024-02-23 16:20', action: 'Listed for trading at 0.5 ETH' }
        ]
    },
    {
        id: 'NFT-904',
        name: 'Stolen Art #1',
        creator: 'ScammerBot',
        collection: 'FakePunks',
        originalityScore: '12%',
        status: 'rejected',
        rejectReason: 'Low originality score, likely a duplicate of an existing asset.',
        image: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?w=500&h=500&fit=crop',
        history: [
            { date: '2024-02-25 08:00', action: 'Submission created by ScammerBot' },
            { date: '2024-02-25 10:15', action: 'Rejected by SuperAdmin. Reason: Low originality score...' }
        ]
    }
];

export default function NFTModeration() {
    const [nfts, setNfts] = useState(initialNfts);
    const [activeTab, setActiveTab] = useState('pending');

    // Modals state
    const [rejectAsset, setRejectAsset] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [historyAsset, setHistoryAsset] = useState(null);

    const filteredNfts = nfts.filter(nft => nft.status === activeTab);

    const logAction = (nftId, actionMsg) => {
        setNfts(prev => prev.map(nft => {
            if (nft.id === nftId) {
                return {
                    ...nft,
                    history: [...nft.history, { date: new Date().toLocaleString(), action: actionMsg }]
                }
            }
            return nft;
        }));
    };

    const handleApprove = (nftId) => {
        setNfts(prev => prev.map(nft => nft.id === nftId ? { ...nft, status: 'approved' } : nft));
        logAction(nftId, 'Approved by Admin. Asset is now tradable.');
    };

    const handleRejectSubmit = () => {
        if (!rejectAsset || !rejectReason.trim()) return;

        setNfts(prev => prev.map(nft => nft.id === rejectAsset.id ? {
            ...nft,
            status: 'rejected',
            rejectReason: rejectReason
        } : nft));

        // Notify Creator logic would go here (Backend call)
        console.log(`Notification sent to ${rejectAsset.creator}: NFT Rejected. Reason: ${rejectReason}`);

        logAction(rejectAsset.id, `Rejected by Admin. Reason: ${rejectReason}`);
        setRejectAsset(null);
        setRejectReason('');
    };

    const handleDisable = (nftId) => {
        // Disabling prevents trading but preserves ownership
        setNfts(prev => prev.map(nft => nft.id === nftId ? { ...nft, status: 'disabled' } : nft));
        logAction(nftId, 'Disabled by Admin. Asset trading locked. Ownership preserved.');
    };

    return (
        <div className="space-y-8 pb-20 relative">
            <AdminPageHeader
                title="Asset Moderation Protocol"
                subtitle="Verify digital assets, originality score, and collection authenticity metrics."
            />

            {/* Status Tabs */}
            <div className="flex border-b border-surface">
                {['pending', 'approved', 'rejected', 'disabled'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-primary' : 'text-muted hover:text-text'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div layoutId="nft-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence>
                    {filteredNfts.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center border-2 border-dashed border-surface rounded-xl">
                            <ImageIcon className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">No assets found in {activeTab} status</p>
                        </motion.div>
                    )}
                    {filteredNfts.map((nft) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={nft.id}
                            className="bg-surface border border-surface rounded-lg overflow-hidden group hover:border-primary/20 transition-all shadow-sm flex flex-col sm:flex-row h-full"
                        >
                            <div className="sm:w-2/5 aspect-square sm:aspect-auto relative bg-bg shrink-0">
                                <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                                {nft.status === 'pending' && parseFloat(nft.originalityScore) < 50 && (
                                    <div className="absolute top-3 left-3 p-1.5 bg-rose-500 text-white rounded-md shadow-lg animate-pulse">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                    </div>
                                )}
                            </div>
                            <div className="p-5 sm:w-3/5 flex flex-col justify-between flex-1">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[9px] font-bold text-primary uppercase tracking-wider mb-0.5">{nft.collection}</p>
                                            <h3 className="text-sm font-bold text-text truncate max-w-[150px]">{nft.name}</h3>
                                            <p className="text-[9px] text-muted font-medium mt-1">Creator: <span className="text-text">{nft.creator}</span></p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-mono text-muted uppercase bg-bg px-2 py-0.5 rounded border border-surface">{nft.id}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="p-2.5 bg-bg rounded-lg border border-surface">
                                            <p className="text-[9px] text-muted mb-1 flex items-center gap-1 font-bold uppercase tracking-wider text-opacity-60">
                                                <Hash className="w-2.5 h-2.5" /> Originality
                                            </p>
                                            <p className={`text-base font-bold tracking-tight ${parseFloat(nft.originalityScore) > 80 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {nft.originalityScore}
                                            </p>
                                        </div>
                                        <div className="p-2.5 bg-bg rounded-lg border border-surface cursor-pointer hover:border-primary/30 transition-all" onClick={() => setHistoryAsset(nft)}>
                                            <p className="text-[9px] text-muted mb-1 flex items-center gap-1 font-bold uppercase tracking-wider text-opacity-60">
                                                <History className="w-2.5 h-2.5" /> Lifecycle
                                            </p>
                                            <p className="text-[10px] font-bold text-primary mt-1.5 underline underline-offset-2">View Audit Log</p>
                                        </div>
                                    </div>

                                    {/* Additional info based on status */}
                                    {nft.status === 'rejected' && (
                                        <div className="mb-4 p-2 bg-rose-500/10 border border-rose-500/20 rounded text-rose-500">
                                            <p className="text-[9px] font-bold uppercase mb-1 flex items-center gap-1">
                                                <MessageSquareX className="w-3 h-3" /> Rejection Reason
                                            </p>
                                            <p className="text-[10px] font-medium leading-relaxed">{nft.rejectReason}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-auto pt-4 border-t border-surface/50">
                                    {nft.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(nft.id)}
                                                className="flex-1 py-2.5 bg-emerald-500 text-black rounded-lg font-bold text-[9px] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                            </button>
                                            <button
                                                onClick={() => setRejectAsset(nft)}
                                                className="flex-1 py-2.5 bg-surface2 text-rose-500 rounded-lg font-bold text-[9px] uppercase tracking-widest hover:bg-rose-500/10 transition-all flex items-center justify-center gap-1.5 border border-surface"
                                            >
                                                <XCircle className="w-3.5 h-3.5" /> Reject
                                            </button>
                                        </>
                                    )}

                                    {nft.status === 'approved' && (
                                        <button
                                            onClick={() => handleDisable(nft.id)}
                                            className="w-full py-2.5 bg-surface2 text-amber-500 rounded-lg font-bold text-[9px] uppercase tracking-widest hover:bg-amber-500/10 transition-all flex items-center justify-center gap-1.5 border border-surface"
                                        >
                                            <Ban className="w-3.5 h-3.5" /> Disable Trading (Preserve Ownership)
                                        </button>
                                    )}

                                    {(nft.status === 'rejected' || nft.status === 'disabled') && (
                                        <span className="w-full text-center py-2.5 text-[9px] font-bold uppercase tracking-widest text-muted bg-surface2 rounded-lg border border-surface">
                                            Terminal State Reached
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {/* Reject Modal */}
                {rejectAsset && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-surface border border-surface rounded-xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <h3 className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Reject Submission
                            </h3>
                            <p className="text-[10px] text-muted font-medium mb-4">
                                Provide a mandatory reason for rejecting <span className="text-text font-bold">"{rejectAsset.name}"</span>. This will notify the creator.
                            </p>

                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Violation of IP, low originality, inappropriate content..."
                                className="w-full bg-bg border border-surface rounded-lg p-3 text-xs font-medium text-text outline-none focus:border-rose-500/50 min-h-[100px] mb-4 resize-none"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setRejectAsset(null); setRejectReason(''); }}
                                    className="flex-1 py-2.5 bg-surface2 text-text font-bold text-[9px] uppercase tracking-widest rounded-lg border border-surface hover:bg-surface transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectSubmit}
                                    disabled={!rejectReason.trim()}
                                    className="flex-1 py-2.5 bg-rose-500 text-white font-bold text-[9px] uppercase tracking-widest rounded-lg hover:bg-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* History/Lifecycle Modal */}
                {historyAsset && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
                            className="bg-surface border border-surface rounded-xl p-6 w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-sm font-bold text-text uppercase tracking-widest flex items-center gap-2">
                                        <History className="w-4 h-4 text-primary" /> Audit Ledger
                                    </h3>
                                    <p className="text-[10px] text-muted font-bold mt-1 uppercase tracking-wider">Asset: {historyAsset.id} - {historyAsset.name}</p>
                                </div>
                                <button onClick={() => setHistoryAsset(null)} className="p-2 bg-surface2 rounded-lg text-muted hover:text-text transition-all">
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                {historyAsset.history.map((log, idx) => (
                                    <div key={idx} className="relative pl-6 pb-4 border-l border-surface last:border-transparent last:pb-0 group">
                                        <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors ring-4 ring-surface" />
                                        <p className="text-[10px] font-mono text-muted mb-1 uppercase bg-surface2 inline-block px-1.5 py-0.5 rounded border border-surface">{log.date}</p>
                                        <p className="text-xs font-medium text-text leading-relaxed">{log.action}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-4 border-t border-surface/50 text-center">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted opacity-50 flex items-center justify-center gap-1.5">
                                    <ShieldCheck className="w-3 h-3" /> End of cryptographically verified logs
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

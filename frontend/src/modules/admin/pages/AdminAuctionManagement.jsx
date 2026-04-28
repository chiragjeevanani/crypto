import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel, CheckCircle, XCircle, Eye, ExternalLink, Clock, X, Play, CreditCard, History } from 'lucide-react';
import { AdminPageHeader, AdminDataTable } from '../components/shared';
import { auctionService } from '../../auction/services/auctionService';
import { useFeedStore } from '../../user/store/useFeedStore';
import Avatar from '../../user/components/shared/Avatar';

const getAssetUrl = (path) => {
    if (!path || path === 'null' || path === 'undefined') return '/person.png';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    // Only prefix if it's an upload path
    if (cleanPath.startsWith('/uploads') || cleanPath.startsWith('/avatars')) {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5004/api').replace('/api', '');
        return `${baseUrl}${cleanPath}`;
    }
    return cleanPath;
};

function PreviewModal({ auction, onClose, onApprove, onReject }) {
    const [confirmAction, setConfirmAction] = useState(null);

    if (!auction) return null;

    const handleConfirm = () => {
        if (confirmAction === 'approve') onApprove(auction._id);
        else onReject(auction._id);
        setConfirmAction(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-bg border border-surface rounded-[32px] w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
                
                {/* Left: Media Section */}
                <div className="md:w-3/5 bg-black relative flex items-center justify-center border-r border-surface">
                    {auction.mediaType === 'video' ? (
                        <video 
                            src={getAssetUrl(auction.mediaUrl)} 
                            controls 
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="max-w-full max-h-full"
                        />
                    ) : (
                        <img 
                            src={getAssetUrl(auction.mediaUrl)} 
                            className="max-w-full max-h-full object-contain" 
                            alt={auction.title}
                        />
                    )}
                    <div className="absolute top-6 left-6 flex gap-2">
                        <div className="px-3 py-1 bg-primary text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                            {auction.status}
                        </div>
                        {auction.listingFeePaid && (
                            <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                                <CheckCircle size={10} /> Fee Paid
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Details Section */}
                <div className="flex-1 flex flex-col bg-surface/10 overflow-hidden relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-surface hover:bg-surface2 text-muted hover:text-text rounded-full transition-all z-10 border border-surface"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex-1 overflow-y-auto p-8 space-y-7 custom-scrollbar pt-16">
                        {confirmAction ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${confirmAction === 'approve' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    {confirmAction === 'approve' ? <CheckCircle size={40} /> : <XCircle size={40} />}
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black">Confirm {confirmAction}?</h2>
                                    <p className="text-sm text-muted">Action will notify @{auction.creator?.handle || auction.creator?.name}</p>
                                </div>
                                <div className="flex gap-3 w-full max-w-sm">
                                    <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 bg-surface rounded-xl font-bold text-xs uppercase">Cancel</button>
                                    <button onClick={handleConfirm} className={`flex-[1.5] py-3 rounded-xl font-bold text-xs uppercase text-white ${confirmAction === 'approve' ? 'bg-emerald-500' : 'bg-rose-500'}`}>Yes, Continue</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <section className="space-y-3">
                                    <h1 className="text-2xl font-black text-text leading-tight">{auction.title}</h1>
                                    <div className="flex items-center gap-2">
                                        <Avatar src={auction.creator?.avatar} size="w-5 h-5" />
                                        <span className="text-xs font-bold text-muted">Auction by <span className="text-text">@{auction.creator?.handle || auction.creator?.name}</span></span>
                                    </div>
                                </section>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-surface/40 rounded-2xl border border-surface space-y-2">
                                        <h3 className="text-[9px] font-black uppercase text-muted tracking-widest flex items-center gap-2">
                                            <History size={12} /> Bidding
                                        </h3>
                                        <div>
                                            <p className="text-xs font-black text-primary">₹{auction.highestBid || auction.basePrice}</p>
                                            <p className="text-[8px] font-bold text-muted uppercase">Min: ₹{auction.basePrice}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-surface/40 rounded-2xl border border-surface space-y-2">
                                        <h3 className="text-[9px] font-black uppercase text-muted tracking-widest flex items-center gap-2">
                                            <CreditCard size={12} /> Payout
                                        </h3>
                                        <div>
                                            <p className="text-xs font-black text-text">-{auction.commissionPct}% Fee</p>
                                            <p className="text-[8px] font-bold text-muted uppercase">GST: {auction.gstPct}%</p>
                                        </div>
                                    </div>
                                </div>

                                <section className="space-y-3 p-4 bg-surface/20 rounded-2xl border border-surface/50">
                                    <h3 className="text-[10px] font-black uppercase text-muted tracking-widest flex items-center gap-2 border-b border-surface pb-2">
                                        <Clock size={12} /> Timeline
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[8px] font-bold text-muted uppercase">Starts</p>
                                            <p className="text-[10px] font-bold">{new Date(auction.startDate).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-muted uppercase">Ends</p>
                                            <p className="text-[10px] font-bold">{new Date(auction.endDate).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </section>

                                {auction.bids && auction.bids.length > 0 && (
                                    <section className="space-y-3">
                                        <h3 className="text-[10px] font-black uppercase text-muted tracking-widest">Recent Activity</h3>
                                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                            {auction.bids.map((bid, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-surface/30 rounded-xl border border-surface/30">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar src={bid.userId?.avatar} size="w-5 h-5" />
                                                        <div>
                                                            <p className="text-[10px] font-black text-text">@{bid.userId?.handle || bid.userId?.name}</p>
                                                            <p className="text-[8px] text-muted font-black">{new Date(bid.createdAt).toLocaleTimeString()}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] font-black text-primary">₹{bid.amount}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <section className="space-y-2">
                                    <h3 className="text-[10px] font-black uppercase text-muted tracking-widest">Story / Description</h3>
                                    <p className="text-xs text-text/60 leading-relaxed font-medium">
                                        {auction.description || 'No description provided.'}
                                    </p>
                                </section>
                            </>
                        )}
                    </div>

                    {!confirmAction && (
                        <div className="shrink-0 p-6 bg-surface border-t border-surface flex gap-3">
                            {auction.status === 'pending' ? (
                                <>
                                    <button onClick={() => setConfirmAction('approve')} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 text-xs uppercase">
                                        <CheckCircle size={16} /> Approve
                                    </button>
                                    <button onClick={() => setConfirmAction('reject')} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-rose-500/20 text-xs uppercase">
                                        <XCircle size={16} /> Reject
                                    </button>
                                </>
                            ) : (
                                <button onClick={onClose} className="w-full py-3 bg-surface2 text-text rounded-xl font-bold text-xs uppercase border border-surface">
                                    Close Preview
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminAuctionManagement() {
    const navigate = useNavigate();
    const { pushNotification } = useFeedStore();
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('pending');
    const [selectedAuction, setSelectedAuction] = useState(null);

    const loadAuctions = async () => {
        setLoading(true);
        try {
            const res = await auctionService.getAuctions(filterStatus === 'all' ? '' : filterStatus);
            setAuctions(res.auctions);
        } catch (err) {
            pushNotification({ type: 'error', title: 'Error', subtitle: 'Failed to load auctions' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAuctions();
    }, [filterStatus]);

    const handlePreview = async (auction) => {
        try {
            const res = await auctionService.getAuctionDetail(auction._id);
            setSelectedAuction({ ...res.auction, bids: res.bids });
        } catch (err) {
            setSelectedAuction(auction); // Fallback to basic info if detail fetch fails
        }
    };

    const handleStatusUpdate = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this auction?`)) return;
        
        try {
            const res = await auctionService.updateStatus(id, status === 'approve' ? 'approved' : 'rejected');
            if (res.success) {
                pushNotification({ type: 'success', title: 'Success', subtitle: `Auction ${status}d successfully` });
                setSelectedAuction(null);
                loadAuctions();
            }
        } catch (err) {
            pushNotification({ type: 'error', title: 'Error', subtitle: 'Failed to update auction status' });
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <AdminPageHeader 
                title="Auction Management"
                subtitle="Review and approve user auction submissions."
            />

            <div className="flex items-center gap-4 p-4 bg-surface/50 border border-surface rounded-xl">
                <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-bg border border-surface rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider text-text outline-none focus:ring-1 focus:ring-primary/20"
                >
                    <option value="all">All Auctions</option>
                    <option value="pending">Pending Approval</option>
                    <option value="live">Live Auctions</option>
                    <option value="ended">Ended</option>
                    <option value="rejected">Rejected</option>
                </select>
                <div className="text-[10px] font-bold text-muted uppercase tracking-widest ml-auto">
                    Total: {auctions.length}
                </div>
            </div>

            <AdminDataTable 
                title="Auction Ledger"
                columns={["Media", "Title", "Creator", "Base/Live Price", "Leading Bidder", "Timeline", "Actions"]}
                data={auctions.map(auction => ({
                    id: auction._id,
                    cells: [
                        <div className="w-12 h-12 rounded-lg bg-black overflow-hidden border border-surface relative flex items-center justify-center">
                            {auction.mediaType === 'video' ? (
                                <video 
                                    src={getAssetUrl(auction.mediaUrl)} 
                                    className="w-full h-full object-cover opacity-60"
                                    muted
                                    playsInline
                                    loop
                                />
                            ) : (
                                <img 
                                    src={getAssetUrl(auction.mediaUrl)} 
                                    className="w-full h-full object-cover" 
                                    alt="" 
                                />
                            )}
                            {auction.mediaType === 'video' && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <Play size={14} className="text-white fill-white" />
                                </div>
                            )}
                        </div>,
                        <div className="max-w-[200px]">
                            <p className="text-xs font-bold text-text truncate">{auction.title}</p>
                            <p className="text-[9px] text-muted uppercase font-bold">{auction.status}</p>
                        </div>,
                        <div className="flex items-center gap-2">
                            <Avatar src={auction.creator?.avatar} size="w-6 h-6" className="rounded-full border border-surface" />
                            <span className="text-[10px] font-bold text-text">@{auction.creator?.handle || auction.creator?.name}</span>
                        </div>,
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted uppercase">Base: ₹{auction.basePrice}</p>
                            <p className="text-xs font-black text-primary">Live: ₹{auction.highestBid || auction.basePrice}</p>
                        </div>,
                        <div className="flex items-center gap-2">
                            {auction.winner ? (
                                <>
                                    <Avatar src={auction.winner?.avatar} size="w-5 h-5" className="rounded-full border border-surface" />
                                    <span className="text-[10px] font-bold text-text">@{auction.winner?.handle || auction.winner?.name}</span>
                                </>
                            ) : (
                                <span className="text-[10px] font-bold text-muted italic">No bids yet</span>
                            )}
                        </div>,
                        <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[9px] text-muted">
                                <Clock size={10} />
                                <span>{new Date(auction.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-muted font-bold">
                                <span>to {new Date(auction.endDate).toLocaleDateString()}</span>
                            </div>
                        </div>,
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handlePreview(auction)}
                                className="p-2 bg-surface2 rounded-lg hover:text-primary transition-colors"
                                title="Open Full Details"
                            >
                                <Eye size={14} />
                            </button>
                            {auction.status === 'pending' && (
                                <>
                                    <button 
                                        onClick={() => handleStatusUpdate(auction._id, 'approve')}
                                        className="p-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all"
                                        title="Approve"
                                    >
                                        <CheckCircle size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleStatusUpdate(auction._id, 'reject')}
                                        className="p-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-all"
                                        title="Reject"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    ]
                }))}
            />

            {auctions.length === 0 && !loading && (
                <div className="py-20 text-center bg-surface/30 border border-dashed border-surface rounded-2xl">
                    <Gavel size={32} className="mx-auto text-muted opacity-20 mb-3" />
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">No auctions in this category</p>
                </div>
            )}

            <PreviewModal 
                auction={selectedAuction} 
                onClose={() => setSelectedAuction(null)}
                onApprove={(id) => handleStatusUpdate(id, 'approve')}
                onReject={(id) => handleStatusUpdate(id, 'reject')}
            />
        </div>
    );
}

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuctionStore } from '../store/useAuctionStore';
import { Clock, Gavel, Trophy, ArrowLeft, History, Info, Send, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../user/utils/formatCurrency';
import { useUserStore } from '../../user/store/useUserStore';
import { useFeedStore } from '../../user/store/useFeedStore';

const getAssetUrl = (path) => {
    if (!path) return '/default-avatar.png';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    if (cleanPath.startsWith('/uploads') || cleanPath.startsWith('/avatars')) {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5004/api').replace('/api', '');
        return `${baseUrl}${cleanPath}`;
    }
    return cleanPath;
};

export default function AuctionDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentAuction, bids, fetchAuctionDetail, leaveAuctionRoom, placeBid, loading } = useAuctionStore();
    const { user } = useUserStore();
    const { pushNotification } = useFeedStore();
    
    const [bidAmount, setBidAmount] = useState('');
    const [timeLeft, setTimeLeft] = useState('');
    const [placingBid, setPlacingBid] = useState(false);
    const [activeTab, setActiveTab] = useState('bids'); // 'bids' or 'details'

    useEffect(() => {
        fetchAuctionDetail(id);
        return () => leaveAuctionRoom(id);
    }, [id, fetchAuctionDetail, leaveAuctionRoom]);

    // Countdown Timer
    useEffect(() => {
        if (!currentAuction || currentAuction.status !== 'live') return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const end = new Date(currentAuction.endDate).getTime();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft('Ended');
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        };

        const timer = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(timer);
    }, [currentAuction]);

    const handleBid = async (e) => {
        e.preventDefault();
        const amount = parseFloat(bidAmount);
        const minBid = (currentAuction.highestBid || currentAuction.basePrice) + 1;

        if (isNaN(amount) || amount < minBid) {
            pushNotification({ type: 'error', title: 'Invalid Bid', subtitle: `Minimum bid is ₹${minBid}` });
            return;
        }

        setPlacingBid(true);
        const res = await placeBid(id, amount);
        setPlacingBid(false);

        if (res.success) {
            setBidAmount('');
            pushNotification({ type: 'success', title: 'Bid Placed!', subtitle: `You are now the highest bidder for ₹${amount}` });
        } else {
            pushNotification({ type: 'error', title: 'Bid Failed', subtitle: res.message });
        }
    };

    if (loading && !currentAuction) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!currentAuction) return null;

    const isLive = currentAuction.status === 'live';
    const isCreator = user?.id === currentAuction.creator?._id;
    const isWinner = user?.id === currentAuction.winner?._id;

    return (
        <div className="flex-1 flex flex-col h-full bg-bg pb-safe">
            {/* Header */}
            <div className="shrink-0 p-4 flex items-center gap-3 backdrop-blur-lg sticky top-0 z-20 bg-bg/80 border-b border-border">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-surface2">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="font-bold text-sm truncate">{currentAuction.title}</h1>
                    <p className="text-[10px] text-muted uppercase font-bold tracking-widest">{currentAuction.status}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar">
                {/* Media Section */}
                <div className="w-full aspect-square relative bg-black flex items-center justify-center">
                    {currentAuction.mediaType === 'video' ? (
                        <video 
                            src={getAssetUrl(currentAuction.mediaUrl)} 
                            controls 
                            autoPlay 
                            muted 
                            loop 
                            className="max-h-full max-w-full"
                        />
                    ) : (
                        <img 
                            src={getAssetUrl(currentAuction.mediaUrl)} 
                            alt={currentAuction.title} 
                            className="max-h-full max-w-full object-contain"
                        />
                    )}
                    
                    {isLive && (
                        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-xl animate-pulse flex items-center gap-2">
                             LIVE AUCTION
                        </div>
                    )}
                </div>

                {/* Info Bar */}
                <div className="p-5 space-y-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Current Bid</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-primary">₹{currentAuction.highestBid || currentAuction.basePrice}</span>
                                <span className="text-xs text-muted">Base: ₹{currentAuction.basePrice}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Time Left</p>
                            <div className="flex items-center gap-2 text-xl font-bold text-text">
                                <Clock size={20} className="text-primary" />
                                <span>{timeLeft}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-surface2 p-3 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-muted uppercase">Bids</p>
                            <p className="font-bold">{bids.length}</p>
                        </div>
                        <div className="bg-surface2 p-3 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-muted uppercase">Participants</p>
                            <p className="font-bold">{new Set(bids.map(b => b.userId?._id)).size}</p>
                        </div>
                        <div className="bg-surface2 p-3 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-muted uppercase">Views</p>
                            <p className="font-bold">1.2k</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-border">
                        <button 
                            onClick={() => setActiveTab('bids')}
                            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'bids' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
                        >
                            Bid History
                        </button>
                        <button 
                            onClick={() => setActiveTab('details')}
                            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
                        >
                            Description
                        </button>
                    </div>

                    {activeTab === 'bids' ? (
                        <div className="space-y-4">
                            {bids.length > 0 ? (
                                bids.map((bid, idx) => (
                                    <div key={bid._id} className="flex items-center justify-between p-3 rounded-xl bg-surface2 border border-border/50">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img src={getAssetUrl(bid.userId?.avatar || '/default-avatar.png')} className="w-10 h-10 rounded-full object-cover" />
                                                {idx === 0 && (
                                                    <div className="absolute -top-1 -right-1 bg-primary p-1 rounded-full border-2 border-surface2">
                                                        <Trophy size={8} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">@{bid.userId?.handle || bid.userId?.name}</p>
                                                <p className="text-[10px] text-muted">{new Date(bid.createdAt).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-primary">₹{bid.amount}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center">
                                    <History size={24} className="mx-auto text-muted mb-2 opacity-50" />
                                    <p className="text-xs text-muted">No bids yet. Be the first!</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <img src={getAssetUrl(currentAuction.creator?.avatar || '/default-avatar.png')} className="w-8 h-8 rounded-full border border-border" />
                                <div>
                                    <p className="text-xs font-bold">@{currentAuction.creator?.handle || currentAuction.creator?.name}</p>
                                    <p className="text-[10px] text-muted">Auction Creator • {currentAuction.creator?.countryCode}</p>
                                </div>
                            </div>
                            <p className="text-sm leading-relaxed text-sub">{currentAuction.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Participation Section */}
            {isLive ? (
                <div className="shrink-0 p-4 bg-bg border-t border-border shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
                    {!isCreator ? (
                        <form onSubmit={handleBid} className="space-y-4">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted group-focus-within:text-primary">₹</div>
                                <input 
                                    type="number"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    placeholder={`Min ₹${(currentAuction.highestBid || currentAuction.basePrice) + 1}`}
                                    className="w-full bg-surface2 border border-border rounded-2xl py-4 pl-8 pr-12 text-lg font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <button 
                                    type="submit"
                                    disabled={placingBid}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-primary text-white disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                                >
                                    {placingBid ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                                </button>
                            </div>
                            <p className="text-center text-[10px] font-bold text-muted flex items-center justify-center gap-1.5">
                                <Info size={12} /> Bids are final and cannot be withdrawn.
                            </p>
                        </form>
                    ) : (
                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                            <p className="text-sm font-bold text-primary">You are the creator of this auction.</p>
                            <p className="text-[10px] text-muted mt-1">Check bidding activity in real-time above.</p>
                        </div>
                    )}
                </div>
            ) : currentAuction.status === 'ended' ? (
                <div className="shrink-0 p-6 bg-surface border-t border-border text-center space-y-3">
                    <Trophy size={40} className="mx-auto text-yellow-500 animate-bounce" />
                    <div>
                        <h3 className="text-lg font-black tracking-tight">AUCTION CLOSED</h3>
                        <p className="text-sm font-bold text-muted">Winner: <span className="text-primary">@{currentAuction.winner?.handle || currentAuction.winner?.name || 'None'}</span></p>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

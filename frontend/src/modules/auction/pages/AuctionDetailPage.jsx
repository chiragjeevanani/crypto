import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuctionStore } from '../store/useAuctionStore';
import { useUserStore } from '../../user/store/useUserStore';
import { useFeedStore } from '../../user/store/useFeedStore';
import { auctionService } from '../services/auctionService';
import { ArrowLeft, Clock, History, Award, Info, Send, Trophy, Heart } from 'lucide-react';
import { formatCurrency } from '../../user/utils/formatCurrency';
import Avatar from '../../user/components/shared/Avatar';
import { WEB3_ENABLED, ipfsToHttp } from '../../../web3config';
import axios from 'axios';

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
    const { user, token } = useUserStore();
    const { pushNotification } = useFeedStore();
    const loginOrLinkWithPrivy = useUserStore(state => state.loginOrLinkWithPrivy);
    const [bidAmount, setBidAmount] = useState('');
    const [timeLeft, setTimeLeft] = useState('');
    const [placingBid, setPlacingBid] = useState(false);
    const [activeTab, setActiveTab] = useState('bids'); // 'bids' or 'details'

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        basePrice: '',
        startDate: '',
        endDate: '',
        royaltyPct: 10
    });
    const [editMedia, setEditMedia] = useState(null);
    const [editPreview, setEditPreview] = useState(null);
    const [updating, setUpdating] = useState(false);

    const handleStartEdit = () => {
        const formatForInput = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        setEditForm({
            title: currentAuction.title || '',
            description: currentAuction.description || '',
            basePrice: currentAuction.basePrice || '',
            startDate: formatForInput(currentAuction.startDate),
            endDate: formatForInput(currentAuction.endDate),
            royaltyPct: currentAuction.royaltyPct || 10
        });
        setEditMedia(null);
        setEditPreview(getAssetUrl(currentAuction.mediaUrl));
        setIsEditing(true);
    };

    const handleDeleteAuction = async () => {
        if (!window.confirm("Are you sure you want to delete this auction? This action cannot be undone.")) return;
        try {
            const res = await auctionService.deleteAuction(id);
            if (res.success) {
                pushNotification({ type: 'success', title: 'Deleted', subtitle: 'Auction deleted successfully.' });
                navigate('/auctions');
            } else {
                pushNotification({ type: 'error', title: 'Error', subtitle: res.message });
            }
        } catch (err) {
            pushNotification({ type: 'error', title: 'Error', subtitle: err.response?.data?.message || err.message });
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        const start = new Date(editForm.startDate);
        const end = new Date(editForm.endDate);
        const now = new Date();

        if (start < new Date(now.getTime() - 2 * 60 * 1000)) {
            pushNotification({ type: 'error', title: 'Invalid Start Date', subtitle: 'Start date cannot be in the past.' });
            return;
        }
        if (end <= start) {
            pushNotification({ type: 'error', title: 'Invalid Dates', subtitle: 'End date must be after the start date.' });
            return;
        }

        setUpdating(true);
        try {
            const formData = new FormData();
            if (editMedia) {
                formData.append('media', editMedia);
            }
            formData.append('title', editForm.title);
            formData.append('description', editForm.description);
            formData.append('basePrice', editForm.basePrice);
            formData.append('startDate', start.toISOString());
            formData.append('endDate', end.toISOString());
            formData.append('royaltyPct', editForm.royaltyPct);

            const res = await auctionService.updateAuction(id, formData);
            if (res.success) {
                pushNotification({ type: 'success', title: 'Updated', subtitle: 'Auction updated successfully.' });
                setIsEditing(false);
                fetchAuctionDetail(id);
            } else {
                pushNotification({ type: 'error', title: 'Error', subtitle: res.message });
            }
        } catch (err) {
            pushNotification({ type: 'error', title: 'Error', subtitle: err.response?.data?.message || err.message });
        } finally {
            setUpdating(false);
        }
    };

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
                             <p className="font-bold">{currentAuction.views || 0}</p>
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
                                                <Avatar src={bid.userId?.avatar} alt={bid.userId?.handle || bid.userId?.name} size="w-10 h-10" />
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
                                <Avatar src={currentAuction.creator?.avatar} alt={currentAuction.creator?.handle || currentAuction.creator?.name} size="w-8 h-8" className="rounded-full border border-border" />
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
            ) : currentAuction.status === 'ended' ? (
                <div className="shrink-0 p-6 bg-surface border-t border-border text-center space-y-3">
                    <Trophy size={40} className="mx-auto text-yellow-500 animate-bounce" />
                    <div>
                        <h3 className="text-lg font-black tracking-tight">AUCTION CLOSED</h3>
                        <p className="text-sm font-bold text-muted">Winner: <span className="text-primary">@{currentAuction.winner?.handle || currentAuction.winner?.name || 'None'}</span></p>
                    </div>
                </div>
            ) : (currentAuction.status === 'pending' || currentAuction.status === 'rejected') ? (
                <div className="shrink-0 p-6 bg-surface border-t border-border flex flex-col gap-3">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center mb-1">
                        <p className="text-sm font-bold text-amber-500">
                            {currentAuction.status === 'pending' ? 'This auction is pending admin approval.' : 'This auction was rejected by admin.'}
                        </p>
                        <p className="text-[10px] text-muted mt-1">You can edit or delete this auction until it goes live.</p>
                    </div>
                    {isCreator && (
                        <div className="flex gap-3">
                            <button 
                                onClick={handleStartEdit} 
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs uppercase cursor-pointer"
                            >
                                Edit Auction
                            </button>
                            <button 
                                onClick={handleDeleteAuction} 
                                className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs uppercase cursor-pointer"
                            >
                                Delete Auction
                            </button>
                        </div>
                    )}
                </div>
            ) : null}

            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-surface border border-border rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto hide-scrollbar">
                        <div className="flex justify-between items-center pb-2 border-b border-border">
                            <h3 className="text-lg font-black">Edit Auction</h3>
                            <button onClick={() => setIsEditing(false)} className="text-muted hover:text-text font-black text-sm uppercase">Close</button>
                        </div>
                        <form onSubmit={handleSaveEdit} className="space-y-4 text-left">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted uppercase">Auction Title</label>
                                <input 
                                    className="w-full bg-surface2 border border-border rounded-xl py-2.5 px-3 text-xs font-bold outline-none"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted uppercase">Description</label>
                                <textarea 
                                    className="w-full bg-surface2 border border-border rounded-xl py-2.5 px-3 text-xs font-medium outline-none min-h-[80px] resize-none"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted uppercase">Base Price (₹)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-surface2 border border-border rounded-xl py-2.5 px-3 text-xs font-bold outline-none"
                                    value={editForm.basePrice}
                                    onChange={(e) => setEditForm({...editForm, basePrice: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted uppercase">Start Date</label>
                                    <input 
                                        type="datetime-local"
                                        className="w-full bg-surface2 border border-border rounded-xl py-2.5 px-3 text-xs font-bold outline-none"
                                        value={editForm.startDate}
                                        onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted uppercase">End Date</label>
                                    <input 
                                        type="datetime-local"
                                        className="w-full bg-surface2 border border-border rounded-xl py-2.5 px-3 text-xs font-bold outline-none"
                                        value={editForm.endDate}
                                        onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted uppercase">Media (Optional Replacement)</label>
                                <input 
                                    type="file" 
                                    accept="image/*,video/*" 
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setEditMedia(file);
                                            setEditPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                    className="text-xs text-muted"
                                />
                                {editPreview && (
                                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black mt-2">
                                        {editMedia?.type.startsWith('video') || currentAuction.mediaType === 'video' && !editMedia ? (
                                            <video src={editPreview} controls muted playsInline className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={editPreview} className="w-full h-full object-cover" alt="" />
                                        )}
                                    </div>
                                )}
                            </div>

                            <button 
                                type="submit" 
                                disabled={updating}
                                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                            >
                                {updating ? 'Saving Changes...' : 'Save Updates'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { useAuctionStore } from '../store/useAuctionStore';
import { useNavigate } from 'react-router-dom';
import { Gavel, Clock, Trophy, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../user/utils/formatCurrency';
import { optimizeCloudinaryUrl } from '../../../utils/mediaOptimization';
import Avatar from '../../user/components/shared/Avatar';

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

export default function AuctionListingPage() {
    const { auctions, fetchAuctions, loading } = useAuctionStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('live');

    useEffect(() => {
        fetchAuctions(activeTab);
    }, [fetchAuctions, activeTab]);

    if (loading && auctions.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 pt-4 pb-20 px-4">
            <header className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>Auctions</h1>
                    <p className="text-sm opacity-50 font-medium">Join live auctions and place your bids</p>
                </div>
                <button 
                    onClick={() => navigate('/auctions/create')}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-md whitespace-nowrap"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                >
                    Create Auction
                </button>
            </header>

            {/* Segmented Control Tabs */}
            <div 
                className="flex items-center p-1.5 rounded-2xl w-full mb-6 relative overflow-hidden"
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}
            >
                <button
                    onClick={() => setActiveTab('live')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all duration-300 z-10 ${activeTab === 'live' ? 'shadow-md scale-100' : 'opacity-50 hover:opacity-100 scale-[0.98]'}`}
                    style={{ 
                        background: activeTab === 'live' ? 'var(--color-primary)' : 'transparent',
                        color: activeTab === 'live' ? '#000' : 'var(--color-text)'
                    }}
                >
                    Live Auctions
                </button>
                <button
                    onClick={() => setActiveTab('ended')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all duration-300 z-10 ${activeTab === 'ended' ? 'shadow-md scale-100' : 'opacity-50 hover:opacity-100 scale-[0.98]'}`}
                    style={{ 
                        background: activeTab === 'ended' ? 'var(--color-primary)' : 'transparent',
                        color: activeTab === 'ended' ? '#000' : 'var(--color-text)'
                    }}
                >
                    Ended Auctions
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {auctions.map((auction) => (
                    <div 
                        key={auction._id}
                        onClick={() => navigate(`/auctions/${auction._id}`)}
                        className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 shadow-lg"
                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    >
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md"
                            style={{ 
                                background: auction.status === 'live' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0,0,0,0.5)',
                                color: '#fff'
                            }}
                        >
                            {auction.status === 'live' && <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse mr-1.5" />}
                            {auction.status}
                        </div>

                        {/* Media Preview */}
                        <div className="aspect-video w-full overflow-hidden bg-black flex items-center justify-center">
                            {auction.mediaType === 'video' ? (
                                <video 
                                    src={getAssetUrl(auction.mediaUrl)} 
                                    autoPlay 
                                    muted 
                                    loop 
                                    playsInline 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                                />
                            ) : (
                                <img 
                                    src={getAssetUrl(
                                        auction.mediaType === 'video' 
                                            ? optimizeCloudinaryUrl(auction.mediaUrl, { isVideo: true, width: 400, format: 'jpg' }) 
                                            : auction.mediaUrl
                                    )} 
                                    alt={auction.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-start gap-2">
                                <h3 className="font-bold text-lg leading-tight truncate flex-1" style={{ color: 'var(--color-text)' }}>{auction.title}</h3>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-muted">Highest Bid</p>
                                    <p className="font-extrabold text-primary text-xl">₹{auction.highestBid || auction.basePrice}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-medium" style={{ color: 'var(--color-sub)' }}>
                                <div className="flex items-center gap-1.5">
                                    <Gavel size={14} />
                                    <span>{auction.status === 'ended' ? 'Final Bid' : 'Base: ₹' + auction.basePrice}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock size={14} />
                                    <span>{auction.status === 'ended' ? 'Closed' : 'Live'}</span>
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Avatar src={auction.creator?.avatar} alt={auction.creator?.handle || auction.creator?.name} size="w-6 h-6" className="rounded-full border" style={{ borderColor: 'var(--color-border)' }} />
                                    <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>@{auction.creator?.handle || auction.creator?.name}</span>
                                </div>
                                <div className="flex items-center text-primary font-bold text-xs uppercase tracking-widest gap-1">
                                    View Details <ChevronRight size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            )}

            {!loading && auctions.length === 0 && (
                <div className="py-20 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface2 text-muted">
                        <Gavel size={32} />
                    </div>
                    <p className="text-muted font-medium">No {activeTab} auctions found</p>
                </div>
            )}
        </div>
    );
}

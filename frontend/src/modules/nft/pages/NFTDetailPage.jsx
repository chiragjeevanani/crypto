import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUserStore } from '../../user/store/useUserStore';
import axios from 'axios';
import { 
  ChevronLeft, ShieldCheck, History, 
  Info, Share2, Heart, Award, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NFTDetailPage = () => {
  const { tokenId: auctionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [buying, setBuying] = useState(false);
  const [buyMessage, setBuyMessage] = useState('');
  const { darkMode, token, user } = useUserStore();

  useEffect(() => {
    fetchDetail();
  }, [auctionId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/nft/${auctionId}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch collectible detail", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    setBuying(true);
    setBuyMessage('');
    try {
      const res = await axios.post(`/api/nft/buy/${auctionId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setBuyMessage(`🎉 Collectible claimed! Your ID: ${res.data.collectibleId}`);
        fetchDetail();
      }
    } catch (err) {
      setBuyMessage(err.response?.data?.message || 'Failed to claim collectible.');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.nft) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 text-center ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
        <Info className="w-16 h-16 text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Collectible Not Found</h2>
        <p className="text-gray-500 mb-6">This collectible may not exist yet.</p>
        <Link to="/nfts" className="px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold">Back to Marketplace</Link>
      </div>
    );
  }

  const { nft, ownershipHistory } = data;
  const isWinner = String(user?.id) === String(nft.auction?.winner?._id);
  const isAuctionEnded = nft.auction?.status === 'ended';
  const alreadyClaimed = Boolean(nft.currentOwner);

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/nfts" className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'}`}>
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="flex gap-2">
            <button className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'}`}>
              <Share2 className="w-5 h-5" />
            </button>
            <button className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'}`}>
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side: Media */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
          >
            <div className={`aspect-square rounded-3xl overflow-hidden shadow-2xl relative ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200'}`}>
              {nft.auction?.mediaType === 'video' ? (
                <video 
                  src={nft.auction?.mediaUrl} 
                  className="w-full h-full object-contain"
                  controls autoPlay loop
                />
              ) : (
                <img 
                  src={nft.auction?.mediaUrl} 
                  alt={nft.auction?.title}
                  className="w-full h-full object-contain"
                />
              )}
              
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/10">
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">KnQ Verified</span>
              </div>
            </div>

            {/* Collectible Info Card */}
            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-zinc-900/50 border border-zinc-800' : 'bg-white border border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm">Collectible ID</span>
                <span className="font-mono text-yellow-500 font-bold">{nft.collectibleId || 'Unclaimed'}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm">Platform</span>
                <span className="font-bold">KnQ Reels</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Creator Royalty</span>
                <span className="font-bold">{nft.royaltyPct}%</span>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-bold border border-yellow-500/20">
                  {nft.royaltyPct}% Creator Royalty
                </div>
                <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold border border-green-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Platform Verified
                </div>
              </div>
              <h1 className="text-4xl font-black mb-4 leading-tight">{nft.auction?.title}</h1>
              <p className={`text-lg mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {nft.auction?.description}
              </p>

              {/* Creator & Owner Bar */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className={`p-4 rounded-2xl flex items-center gap-3 ${darkMode ? 'bg-zinc-900' : 'bg-gray-100'}`}>
                  <img src={nft.auction?.creator?.avatar || '/default-avatar.png'} className="w-10 h-10 rounded-full" alt="" />
                  <div className="overflow-hidden">
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Creator</div>
                    <div className="font-bold truncate text-yellow-500">@{nft.auction?.creator?.handle || 'creator'}</div>
                  </div>
                </div>
                <div className={`p-4 rounded-2xl flex items-center gap-3 ${darkMode ? 'bg-zinc-900' : 'bg-gray-100'}`}>
                  <img src={nft.currentOwner?.avatar || '/default-avatar.png'} className="w-10 h-10 rounded-full" alt="" />
                  <div className="overflow-hidden">
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Owner</div>
                    <div className="font-bold truncate text-yellow-500">
                      {nft.currentOwner ? `@${nft.currentOwner.handle || nft.currentOwner.name}` : 'Available'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Action Section */}
              <div className={`p-8 rounded-3xl border-2 mb-8 ${darkMode ? 'bg-zinc-900/30 border-yellow-500/20' : 'bg-white border-yellow-500/10'}`}>
                <div className="text-sm text-gray-500 mb-2 font-medium">Winning Bid</div>
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-5xl font-black text-yellow-500">{nft.auction?.highestBid}</span>
                  <span className="text-xl font-bold text-gray-400">Coins</span>
                </div>

                {buyMessage && (
                  <p className="mb-4 text-sm font-bold text-center px-4 py-2 rounded-xl bg-yellow-500/10 text-yellow-600">{buyMessage}</p>
                )}

                {isWinner && isAuctionEnded && !alreadyClaimed ? (
                  <button
                    onClick={handleBuy}
                    disabled={buying}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl font-black transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                  >
                    <Coins className="w-5 h-5" />
                    {buying ? 'Claiming...' : `Claim for ${nft.auction?.highestBid} Coins`}
                  </button>
                ) : alreadyClaimed ? (
                  <div className="w-full flex items-center justify-center gap-2 py-4 bg-green-500/10 text-green-500 rounded-2xl font-black border border-green-500/20">
                    <ShieldCheck className="w-5 h-5" />
                    Claimed — {nft.collectibleId}
                  </div>
                ) : (
                  <div className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black border ${darkMode ? 'bg-zinc-800 border-zinc-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                    {isAuctionEnded ? 'Auction Ended' : 'Auction In Progress'}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-6 border-b border-zinc-800 mb-6">
                {['details', 'history'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-yellow-500' : 'text-gray-500'}`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="min-h-[200px]">
                <AnimatePresence mode="wait">
                  {activeTab === 'details' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex gap-3">
                        <Info className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-bold mb-1">Authenticity Guaranteed</h4>
                          <p className="text-sm text-gray-500">This collectible was created by a verified KnQ Reels creator and has been reviewed by our moderation team.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Award className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-bold mb-1">Creator Royalty</h4>
                          <p className="text-sm text-gray-500">The original creator receives {nft.royaltyPct}% of every future resale of this digital collectible.</p>
                        </div>
                      </div>
                      
                      {nft.auction?.proofVideoUrl && (
                        <div className="flex gap-3 mt-4">
                          <ShieldCheck className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                          <div className="w-full">
                            <h4 className="font-bold mb-1">Proof of Authenticity</h4>
                            <p className="text-sm text-gray-500 mb-3">The creator provided a proof video to verify the authenticity of this collectible.</p>
                            <video 
                              src={nft.auction.proofVideoUrl} 
                              controls 
                              className="w-full rounded-2xl bg-black object-contain" 
                              style={{ maxHeight: '240px' }} 
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'history' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {ownershipHistory.length === 0 ? (
                        <p className="text-gray-500 text-sm">No ownership history yet.</p>
                      ) : ownershipHistory.map((event, idx) => (
                        <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border ${darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${event.transferType === 'initial_sale' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                            {event.transferType === 'initial_sale' ? <Award className="w-5 h-5" /> : <History className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-bold capitalize">{event.transferType === 'initial_sale' ? 'Initial Sale' : 'Resale'}</span>
                              <span className="text-[10px] text-gray-500">{new Date(event.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              To <span className="text-yellow-500 font-bold">@{event.toUser?.handle || event.toUser?.name || 'Unknown'}</span>
                              {' · '}{event.salePrice} coins
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default NFTDetailPage;

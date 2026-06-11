import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../user/store/useUserStore';
import axios from 'axios';
import { 
  Wallet, Grid, List, Plus, ShieldCheck, Award,
  ChevronRight, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MyNFTsPage = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  
  const { user, token, darkMode } = useUserStore();

  useEffect(() => {
    fetchMyCollection();
  }, []);

  const fetchMyCollection = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/nft/my/collection', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setNfts(res.data.nfts);
      }
    } catch (err) {
      console.error("Failed to fetch collection", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
      <div className="max-w-7xl mx-auto px-4 pt-10">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img src={user?.avatar || '/default-avatar.png'} className="w-24 h-24 rounded-3xl object-cover ring-4 ring-yellow-500/20" alt="" />
              {user?.kycStatus === 'verified' && (
                <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black p-1.5 rounded-xl shadow-lg border-2 border-black">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black mb-1">{user?.name}</h1>
              <p className="text-gray-500 font-medium">@{user?.handle}</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Collectibles Owned', value: nfts.length, icon: Wallet },
            { label: 'Recharge Coins', value: user?.rechargeCoins || 0, icon: Plus },
            { label: 'Earning Coins', value: user?.earningCoins || 0, icon: Award },
            { label: 'KYC Status', value: user?.kycStatus || 'Not Verified', icon: ShieldCheck, highlight: user?.kycStatus === 'verified' ? 'text-green-500' : 'text-red-500' }
          ].map((stat, idx) => (
            <div key={idx} className={`p-6 rounded-2xl ${darkMode ? 'bg-zinc-900/50 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm'}`}>
              <stat.icon className="w-5 h-5 text-gray-500 mb-4" />
              <div className="text-2xl font-black mb-1">{stat.value}</div>
              <div className={`text-xs font-bold uppercase tracking-widest text-gray-500 ${stat.highlight || ''}`}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Collection Controls */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black flex items-center gap-3">
            My Collection
            {nfts.length > 0 && <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-lg">{nfts.length}</span>}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-yellow-500 text-black' : darkMode ? 'bg-zinc-900 text-gray-500' : 'bg-white text-gray-500'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-yellow-500 text-black' : darkMode ? 'bg-zinc-900 text-gray-500' : 'bg-white text-gray-500'}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button 
              onClick={fetchMyCollection}
              className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-zinc-900 text-gray-500' : 'bg-white text-gray-500'}`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collectible Display */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`aspect-[3/4] rounded-2xl animate-pulse ${darkMode ? 'bg-zinc-900' : 'bg-gray-200'}`} />
            ))}
          </div>
        ) : nfts.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
            {nfts.map((item) => (
              viewMode === 'grid' ? (
                <Link 
                  to={`/nfts/${item.auctionId}`} 
                  key={item.collectibleId}
                  className={`group rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'}`}
                >
                  <div className="relative aspect-square overflow-hidden">
                    {item.mediaType === 'video' ? (
                      <video src={item.mediaUrl} className="w-full h-full object-cover" muted loop onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                    ) : (
                      <img src={item.mediaUrl} className="w-full h-full object-cover" alt={item.title} />
                    )}
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold text-yellow-400">
                      {item.collectibleId}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold truncate mb-2">{item.title || 'Untitled Collectible'}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">KnQ Verified</span>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              ) : (
                <div key={item.collectibleId} className={`p-4 rounded-2xl flex items-center gap-6 ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm'}`}>
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800">
                    <img src={item.mediaUrl} className="w-full h-full object-cover" alt={item.title} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black truncate">{item.title}</h3>
                    <div className="text-xs text-gray-500 font-mono">{item.collectibleId}</div>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Acquired</div>
                    <div className="font-bold text-sm">{new Date(item.acquiredAt).toLocaleDateString()}</div>
                  </div>
                  <Link to={`/nfts/${item.auctionId}`} className="px-5 py-2.5 bg-yellow-500 text-black font-bold rounded-xl text-sm">View</Link>
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="relative inline-block mb-6">
              <Plus className="w-16 h-16 text-yellow-500/20 animate-ping absolute inset-0" />
              <Plus className="w-16 h-16 text-yellow-500/40 relative z-10" />
            </div>
            <h3 className="text-2xl font-black mb-2">No Collectibles Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-10">You haven't acquired any digital collectibles yet. Win an auction to claim one!</p>
            <Link to="/nfts" className="px-10 py-4 bg-yellow-500 text-black font-black rounded-2xl shadow-xl shadow-yellow-500/10 hover:-translate-y-0.5 transition-all">
              Go to Marketplace
            </Link>
          </div>
        )}

        {/* Platform Security Info */}
        <div className={`mt-20 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6 border ${darkMode ? 'bg-zinc-900/20 border-zinc-800' : 'bg-gray-100 border-gray-200'}`}>
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="font-black text-lg mb-1">Platform-Secured Ownership</h4>
            <p className="text-gray-500 text-sm">Your collectibles are secured on the KnQ platform. Each collectible has a unique platform-issued ID and ownership certificate stored in our database.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyNFTsPage;

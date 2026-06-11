import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../user/store/useUserStore';
import axios from 'axios';
import { ShoppingBag, Filter, Search, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const NFTMarketplacePage = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { darkMode } = useUserStore();

  useEffect(() => {
    fetchMarketplace();
  }, [filter]);

  const fetchMarketplace = async () => {
    try {
      setLoading(true);
      const mediaType = filter === 'all' ? '' : filter;
      const res = await axios.get(`/api/nft/marketplace?mediaType=${mediaType}`);
      if (res.data.success) {
        setNfts(res.data.nfts);
      }
    } catch (err) {
      console.error("Failed to fetch marketplace", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNfts = nfts.filter(nft => 
    nft.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nft.creator?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nft.creator?.handle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-amber-900/20 z-0" />
        <div className="z-10 text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent"
          >
            Digital Collectibles
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-lg mx-auto"
          >
            Own unique moments from your favorite creators. Platform-verified collectibles.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        {/* Filters & Search */}
        <div className={`p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 mb-8 ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200'}`}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search by title or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-yellow-500/50 ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['all', 'video', 'image', 'audio'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                  filter === type 
                    ? 'bg-yellow-500 text-black' 
                    : darkMode ? 'bg-zinc-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-black'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* NFT Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className={`aspect-[3/4] rounded-2xl animate-pulse ${darkMode ? 'bg-zinc-900' : 'bg-gray-200'}`} />
            ))}
          </div>
        ) : filteredNfts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNfts.map((nft) => (
              <Link 
                to={`/nfts/${nft.auctionId}`} 
                key={nft.auctionId}
                className={`group rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  {nft.mediaType === 'video' ? (
                    <video 
                      src={nft.mediaUrl} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      muted
                      onMouseOver={e => e.target.play()}
                      onMouseOut={e => {e.target.pause(); e.target.currentTime = 0;}}
                    />
                  ) : (
                    <img 
                      src={nft.mediaUrl} 
                      alt={nft.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-yellow-400" />
                    KnQ VERIFIED
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={nft.creator?.avatar || '/default-avatar.png'} className="w-5 h-5 rounded-full" alt="" />
                    <span className="text-xs text-gray-500 truncate">@{nft.creator?.handle || 'creator'}</span>
                  </div>
                  <h3 className="font-bold truncate mb-1">{nft.title}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-gray-500">Highest Bid</div>
                    <div className="font-bold text-yellow-500">{nft.highestBid} Coins</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2">No collectibles found</h3>
            <p className="text-gray-500">Try changing your filters or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTMarketplacePage;

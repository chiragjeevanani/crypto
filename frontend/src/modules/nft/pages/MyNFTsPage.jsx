import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../user/store/useUserStore';
import { ipfsToHttp, getOpenSeaUrl } from '../../../web3config';
import axios from 'axios';
import { 
  Wallet, Grid, List, Plus, ShieldCheck, Award,
  ChevronRight, ExternalLink, RefreshCw, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLogin, usePrivy } from '@privy-io/react-auth';

const MyNFTsPage = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [isLinking, setIsLinking] = useState(false);
  
  const { user, token, darkMode } = useUserStore();
  const loginOrLinkWithPrivy = useUserStore(state => state.loginOrLinkWithPrivy);
  const { getAccessToken } = usePrivy();

  const { login: linkPrivyWallet } = useLogin({
    onComplete: async (privyUser, isNewUser, wasAlreadyAuthenticated) => {
      setIsLinking(true);
      try {
        const privyToken = await getAccessToken();
        await loginOrLinkWithPrivy(privyToken);
      } catch (err) {
        console.error("Privy linking failed:", err);
      } finally {
        setIsLinking(false);
      }
    }
  });

  useEffect(() => {
    if (user?.walletAddress) {
      fetchMyCollection();
    } else {
      setLoading(false);
    }
  }, [user?.walletAddress]);

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
        
        {/* Profile Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img src={user?.avatar || '/default-avatar.png'} className="w-24 h-24 rounded-3xl object-cover ring-4 ring-yellow-500/20" />
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

          <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
            {!user?.walletAddress && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={linkPrivyWallet}
                disabled={isLinking}
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-600 text-black font-black rounded-2xl shadow-xl hover:shadow-yellow-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLinking ? 'Activating...' : 'Enable Digital Wallet'}
              </motion.button>
            )}
            {user?.walletAddress && (
              <div className={`px-4 py-2 rounded-xl flex items-center gap-3 text-xs font-mono border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Linked: {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-8)}
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'NFTs Owned', value: nfts.length, icon: Wallet },
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

        {/* NFT Display */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`aspect-[3/4] rounded-2xl animate-pulse ${darkMode ? 'bg-zinc-900' : 'bg-gray-200'}`} />
            ))}
          </div>
        ) : !user?.walletAddress ? (
          <div className={`p-12 rounded-3xl text-center border-2 border-dashed ${darkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-20" />
            <h3 className="text-2xl font-black mb-2">Wallet Not Enabled</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">Enable your secure digital wallet to view, claim, and trade your verified creator collectibles.</p>
            <button 
              onClick={linkPrivyWallet}
              disabled={isLinking}
              className="px-10 py-4 bg-yellow-500 text-black font-black rounded-2xl shadow-xl shadow-yellow-500/10 hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLinking ? 'Activating...' : 'Enable Digital Wallet'}
            </button>
          </div>
        ) : nfts.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
            {nfts.map((item) => (
              viewMode === 'grid' ? (
                <Link 
                  to={`/nfts/${item.tokenId}`} 
                  key={item.tokenId}
                  className={`group rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'}`}
                >
                  <div className="relative aspect-square overflow-hidden">
                    {item.auction?.mediaType === 'video' ? (
                      <video src={item.auction?.mediaUrl} className="w-full h-full object-cover" muted loop onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                    ) : (
                      <img src={item.auction?.mediaUrl} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      #{item.tokenId}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold truncate mb-2">{item.auction?.title || 'Untitled NFT'}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Polygon</span>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              ) : (
                <div key={item.tokenId} className={`p-4 rounded-2xl flex items-center gap-6 ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100 shadow-sm'}`}>
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800">
                    <img src={item.auction?.mediaUrl} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black truncate">{item.auction?.title}</h3>
                    <div className="text-xs text-gray-500 font-mono">Token ID: #{item.tokenId}</div>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Acquired</div>
                    <div className="font-bold text-sm">{new Date(item.acquiredAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <a href={getOpenSeaUrl(item.tokenId)} target="_blank" rel="noreferrer" className={`p-2.5 rounded-xl ${darkMode ? 'bg-zinc-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black'}`}>
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <Link to={`/nfts/${item.tokenId}`} className="px-5 py-2.5 bg-yellow-500 text-black font-bold rounded-xl text-sm">View Detail</Link>
                  </div>
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
            <h3 className="text-2xl font-black mb-2">No NFTs Found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-10">You haven't acquired any digital collectibles yet. Explore the marketplace to find unique assets from Indian creators.</p>
            <Link to="/nfts" className="px-10 py-4 bg-yellow-500 text-black font-black rounded-2xl shadow-xl shadow-yellow-500/10 hover:-translate-y-0.5 transition-all">
              Go to Marketplace
            </Link>
          </div>
        )}

        {/* Security Info */}
        <div className={`mt-20 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6 border ${darkMode ? 'bg-zinc-900/20 border-zinc-800' : 'bg-gray-100 border-gray-200'}`}>
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="font-black text-lg mb-1">Secure Blockchain Ownership</h4>
            <p className="text-gray-500 text-sm">Your NFTs are stored safely on the Polygon blockchain, custodied under your managed Privy wallet. Platform-sponsored structures keep trades fast and gas-free.</p>
          </div>
          <div className="flex gap-4">
            <a href="https://polygon.technology" target="_blank" rel="noreferrer" className="text-xs font-bold text-gray-400 hover:text-yellow-500">Learn about Polygon</a>
            <a href="https://privy.io" target="_blank" rel="noreferrer" className="text-xs font-bold text-gray-400 hover:text-yellow-500">About Privy Wallets</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyNFTsPage;

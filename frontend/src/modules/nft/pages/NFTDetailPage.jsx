import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUserStore } from '../../user/store/useUserStore';
import { getTxUrl, getOpenSeaUrl, ipfsToHttp } from '../../../web3config';
import axios from 'axios';
import { 
  ChevronLeft, ExternalLink, ShieldCheck, History, 
  Info, Share2, Heart, Award, Globe, Copy, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NFTDetailPage = () => {
  const { tokenId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [copied, setCopied] = useState(false);
  const { darkMode } = useUserStore();

  useEffect(() => {
    fetchNFTDetail();
  }, [tokenId]);

  const fetchNFTDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/nft/${tokenId}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch NFT detail", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <h2 className="text-2xl font-bold mb-2">NFT Not Found</h2>
        <p className="text-gray-500 mb-6">This token might not have been minted yet or doesn't exist.</p>
        <Link to="/nfts" className="px-6 py-3 bg-yellow-500 text-black rounded-xl font-bold">Back to Marketplace</Link>
      </div>
    );
  }

  const { nft, ownershipHistory } = data;

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
          {/* Left Side: Media Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
          >
            <div className={`aspect-square rounded-3xl overflow-hidden shadow-2xl relative ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200'}`}>
              {nft.auction.mediaType === 'video' ? (
                <video 
                  src={nft.auction.mediaUrl} 
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  loop
                />
              ) : (
                <img 
                  src={nft.auction.mediaUrl} 
                  alt={nft.auction.title}
                  className="w-full h-full object-contain"
                />
              )}
              
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/10">
                <Globe className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Polygon Network</span>
              </div>
            </div>

            {/* Contract Info Card */}
            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-zinc-900/50 border border-zinc-800' : 'bg-white border border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm">Contract Address</span>
                <button 
                  onClick={() => copyToClipboard(nft.contractAddress)}
                  className="flex items-center gap-1.5 text-xs font-mono text-yellow-500 hover:opacity-80"
                >
                  {nft.contractAddress.slice(0, 6)}...{nft.contractAddress.slice(-4)}
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm">Token ID</span>
                <span className="font-mono text-white">#{nft.tokenId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Token Standard</span>
                <span className="text-white">ERC-721 (Royalty Enabled)</span>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Info Section */}
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
                {nft.auction.creator?.countryCode === 'IN' && (
                  <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold border border-green-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified Creator
                  </div>
                )}
              </div>
              <h1 className="text-4xl font-black mb-4 leading-tight">{nft.auction.title}</h1>
              <p className={`text-lg mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {nft.auction.description}
              </p>

              {/* Creator & Owner Bar */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className={`p-4 rounded-2xl flex items-center gap-3 ${darkMode ? 'bg-zinc-900' : 'bg-gray-100'}`}>
                  <img src={nft.auction.creator?.avatar || '/default-avatar.png'} className="w-10 h-10 rounded-full" />
                  <div className="overflow-hidden">
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Creator</div>
                    <div className="font-bold truncate text-yellow-500">@{nft.auction.creator?.handle || 'creator'}</div>
                  </div>
                </div>
                <div className={`p-4 rounded-2xl flex items-center gap-3 ${darkMode ? 'bg-zinc-900' : 'bg-gray-100'}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {nft.currentOwnerWallet.slice(2, 4).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Current Owner</div>
                    <div className="font-bold truncate text-yellow-500 font-mono">
                      {nft.currentOwnerWallet.slice(0, 6)}...{nft.currentOwnerWallet.slice(-4)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Section */}
              <div className={`p-8 rounded-3xl border-2 mb-8 ${darkMode ? 'bg-zinc-900/30 border-yellow-500/20' : 'bg-white border-yellow-500/10'}`}>
                <div className="text-sm text-gray-500 mb-2 font-medium">Minted Price (Last Highest Bid)</div>
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-5xl font-black text-yellow-500">{nft.auction.highestBid}</span>
                  <span className="text-xl font-bold text-gray-400">Coins</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a 
                    href={nft.openSeaUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-4 bg-[#2081E2] hover:bg-[#1868B7] text-white rounded-2xl font-black transition-all transform hover:scale-[1.02] active:scale-95"
                  >
                    View on OpenSea <ExternalLink className="w-5 h-5" />
                  </a>
                  <a 
                    href={nft.explorerUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all border transform hover:scale-[1.02] active:scale-95 ${darkMode ? 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700' : 'bg-gray-100 border-gray-200 text-black hover:bg-gray-200'}`}
                  >
                    Blockchain View <Globe className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="flex gap-6 border-b border-zinc-800 mb-6">
                {['details', 'history', 'metadata'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${
                      activeTab === tab ? 'text-yellow-500' : 'text-gray-500'
                    }`}
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
                      <div className="flex justify-between items-start gap-10">
                        <div className="flex gap-3">
                          <Info className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <h4 className="font-bold mb-1">Authenticity Guaranteed</h4>
                            <p className="text-sm text-gray-500">This NFT was minted using the official KnQ Reels platform smart contract and has been verified by our moderation team.</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Award className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-bold mb-1">Perpetual Royalties</h4>
                          <p className="text-sm text-gray-500">The original creator will receive {nft.royaltyPct}% of every future resale of this digital asset, encoded on the blockchain.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'history' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {ownershipHistory.map((event, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${event.transferType === 'mint' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                            {event.transferType === 'mint' ? <Award className="w-5 h-5" /> : <History className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-bold capitalize">{event.transferType}</span>
                              <span className="text-[10px] text-gray-500">{new Date(event.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              To <span className="text-gray-300 font-mono">{event.toAddress.slice(0, 10)}...</span>
                            </div>
                          </div>
                          <a href={getTxUrl(event.txHash)} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-4 h-4 text-gray-600 hover:text-white" />
                          </a>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'metadata' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="p-4 rounded-xl bg-zinc-900 font-mono text-xs overflow-x-auto border border-zinc-800">
                        <pre className="text-yellow-500/80">{JSON.stringify({
                          name: nft.auction.title,
                          description: nft.auction.description,
                          image: nft.ipfsFileUri,
                          animation_url: nft.auction.mediaType === 'video' ? nft.ipfsFileUri : undefined,
                          attributes: [
                            { trait_type: "Creator", value: `@${nft.auction.creator?.handle}` },
                            { trait_type: "Royalty", value: `${nft.royaltyPct}%` },
                            { trait_type: "Platform", value: "KnQ Reels" }
                          ]
                        }, null, 2)}</pre>
                      </div>
                      <div className="mt-4 flex items-center justify-center">
                        <a 
                          href={nft.metadataGatewayUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-gray-500 flex items-center gap-1 hover:text-white transition-colors"
                        >
                          View raw metadata on IPFS (via Pinata) <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
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

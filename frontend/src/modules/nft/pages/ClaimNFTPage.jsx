import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../../user/store/useUserStore';
import { useFeedStore } from '../../user/store/useFeedStore';
import { ipfsToHttp, VAULT_CONTRACT_ADDRESS, getTxUrl } from '../../../web3config';
import axios from 'axios';
import { 
  ChevronLeft, Wallet, ShieldCheck, ArrowRight, 
  RefreshCw, CheckCircle2, AlertTriangle, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// Minimal ABI for the Vault contract deposit function
const VAULT_ABI = [
  {
    "inputs": [{ "internalType": "string", "name": "_auctionId", "type": "string" }],
    "name": "depositBid",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const ClaimNFTPage = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { pushNotification } = useFeedStore();
  const { user, darkMode, updateProfile } = useUserStore();
  const { address, isConnected } = useAccount();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [maticPrice, setMaticPrice] = useState(0); // INR per MATIC

  // Wagmi Hooks for Contract Interaction
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    fetchAuctionDetail();
    fetchMaticPrice();
  }, [auctionId]);

  useEffect(() => {
    if (isConfirmed && hash) {
      handleClaimSuccess(hash);
    }
  }, [isConfirmed, hash]);

  const fetchAuctionDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/auctions/${auctionId}`);
      if (res.data.success) {
        setAuction(res.data.auction);
      }
    } catch (err) {
      console.error("Failed to fetch auction", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaticPrice = async () => {
    try {
      const res = await axios.get('/api/config/matic-price');
      if (res.data.success) {
        setMaticPrice(res.data.price);
      }
    } catch (err) {
      console.error("Price fetch failed, using fallback", err);
      setMaticPrice(7); // Fallback: ₹7 per MATIC
    }
  };

  const handleLinkWallet = async () => {
    if (!isConnected || !address) return;
    try {
      setIsLinking(true);
      const res = await axios.post('/api/nft/wallet/link', { walletAddress: address });
      if (res.data.success) {
        updateProfile({ walletAddress: address.toLowerCase() });
        pushNotification({ type: 'success', title: 'Wallet Linked', subtitle: 'You can now proceed to claim your NFT.' });
      }
    } catch (err) {
      pushNotification({ type: 'error', title: 'Linking Failed', subtitle: err.response?.data?.message || "Could not link wallet." });
    } finally {
      setIsLinking(false);
    }
  };

  const handleClaimSuccess = async (txHash) => {
    try {
      pushNotification({ type: 'success', title: 'Payment Sent', subtitle: 'Recording your deposit on the server...' });
      
      // Record the vault deposit tx hash
      const res = await axios.post(`/api/nft/deposit/record/${auctionId}`, { txHash });
      if (res.data.success) {
        pushNotification({ 
          type: 'success', 
          title: 'Deposit Received!', 
          subtitle: 'The admin has been notified to finalize your NFT settlement.' 
        });
        // Stay on page to show status or redirect to my collection
        setTimeout(() => navigate('/nft/my/collection'), 3000);
      }
    } catch (err) {
      console.error("Recording deposit failed", err);
      pushNotification({ type: 'warning', title: 'Record Pending', subtitle: 'Transaction sent but server update failed. Admin will verify manually.' });
    }
  };

  const executeClaim = async () => {
    if (!isConnected || !address) {
      pushNotification({ type: 'error', title: 'Wallet Not Connected', subtitle: 'Please connect MetaMask first.' });
      return;
    }

    if (!user?.walletAddress) {
      pushNotification({ type: 'warning', title: 'Wallet Not Linked', subtitle: 'Please link your wallet to your account first.' });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Calculate MATIC amount (Final Bid INR / MATIC Rate)
      // Example: ₹1000 bid / ₹7 rate = 142.85 MATIC
      const maticAmount = (auction.highestBid / maticPrice).toFixed(6);
      
      writeContract({
        address: VAULT_CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'depositBid',
        args: [auctionId],
        value: parseEther(maticAmount)
      });

    } catch (err) {
      console.error("Transaction failed", err);
      pushNotification({ type: 'error', title: 'Transaction Failed', subtitle: err.message });
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 text-center ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Auction Not Found</h2>
        <p className="text-gray-500 mb-6">We couldn't retrieve the details for this auction.</p>
        <Link to="/auctions" className="px-6 py-3 bg-zinc-800 text-white rounded-xl font-bold">Back to Auctions</Link>
      </div>
    );
  }

  const isWinner = user?.id === auction?.winner?._id || user?._id === auction?.winner?._id;
  
  // Final bid in INR / (INR/MATIC rate)
  const maticToPay = maticPrice > 0 ? (auction.highestBid / maticPrice).toFixed(6) : "0.00";

  if (!isWinner) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 text-center ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-6">Only the auction winner can claim this NFT.</p>
        <Link to="/auctions" className="px-6 py-3 bg-zinc-800 text-white rounded-xl font-bold">Back to Auctions</Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
      <div className="max-w-3xl mx-auto px-4 pt-10">
        
        <header className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate(-1)} className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white hover:bg-gray-200 border'}`}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black">Claim Your Digital Asset</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Auction ID: {auctionId.slice(-6)}</p>
          </div>
        </header>

        <div className="space-y-8">
          {/* Asset Preview Card */}
          <div className={`p-6 rounded-3xl flex items-center gap-6 ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border shadow-sm'}`}>
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black shrink-0">
              {auction.mediaType === 'video' ? (
                <video src={ipfsToHttp(auction.ipfsFileUri) || auction.mediaUrl} className="w-full h-full object-cover" muted />
              ) : (
                <img src={ipfsToHttp(auction.ipfsFileUri) || auction.mediaUrl} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black truncate mb-1">{auction.title}</h2>
              <p className="text-sm text-gray-500 truncate mb-3">By @{auction.creator?.handle}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-[10px] font-black border border-yellow-500/20">
                <ShieldCheck className="w-3 h-3" /> VERIFIED COLLECTIBLE
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className={`p-8 rounded-3xl space-y-6 ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border shadow-sm'}`}>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-bold">Winning Bid</span>
              <span className="text-xl font-black">₹{auction.highestBid}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-bold">Network</span>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-500" />
                <span className="font-bold">Polygon (PoS)</span>
              </div>
            </div>
            <div className="h-px bg-zinc-800" />
            <div className="flex justify-between items-end">
              <div>
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest block mb-1">Total to Escrow</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-yellow-500">{maticToPay}</span>
                  <span className="text-xl font-bold text-gray-400">MATIC</span>
                </div>
              </div>
              <div className="text-right text-[10px] text-gray-500 font-medium">
                1 MATIC ≈ ₹{maticPrice || "..."}
                <br />
                Gas fees apply
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <ConnectButton />
            </div>

            <AnimatePresence mode="wait">
              {isConfirmed ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-black text-green-500 mb-1">Payment Sent Successfully!</h3>
                  <p className="text-xs text-gray-500 mb-4">Your MATIC is in the secure vault. Admin will now finalize the NFT settlement.</p>
                  <a href={getTxUrl(hash)} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">View on Polygonscan</a>
                </motion.div>
              ) : isConfirming ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-10 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-4"
                >
                  <RefreshCw className="w-12 h-12 text-yellow-500 mx-auto animate-spin" />
                  <h3 className="text-xl font-black">Confirming Payment...</h3>
                  <p className="text-sm text-gray-500">Please wait while the transaction is being verified on the blockchain.</p>
                </motion.div>
              ) : isConnected && !user?.walletAddress ? (
                <motion.button
                  key="link-wallet"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLinkWallet}
                  disabled={isLinking}
                  className="w-full py-5 rounded-2xl font-black text-lg bg-white text-black shadow-xl flex items-center justify-center gap-3 border-4 border-yellow-500"
                >
                  {isLinking ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <>Step 1: Link Wallet to Account <ArrowRight className="w-6 h-6" /></>
                  )}
                </motion.button>
              ) : (
                <motion.button
                  key="claim-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={executeClaim}
                  disabled={!isConnected || !user?.walletAddress || isPending}
                  className={`w-full py-5 rounded-2xl font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 ${
                    isConnected && user?.walletAddress && !isPending
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-600 text-black shadow-yellow-500/20'
                      : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isPending ? (
                    <>Confirm in Wallet...</>
                  ) : !user?.walletAddress ? (
                    <>Link Wallet First</>
                  ) : (
                    <>Step 2: Escrow Payment & Claim NFT <ArrowRight className="w-6 h-6" /></>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            {writeError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
                {writeError.message.includes('User rejected') ? 'Transaction was cancelled in wallet.' : writeError.message}
              </div>
            )}
          </div>

          <p className="text-center text-[10px] text-gray-500 max-w-sm mx-auto leading-relaxed">
            By proceeding, you are escrowing MATIC on the Polygon network. The funds will be held in the KnQ Vault contract until the atomic settlement transfers the NFT to your address.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClaimNFTPage;

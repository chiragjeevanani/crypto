import React, { useEffect, useState, useRef } from 'react';
import { useUserStore, getStoredToken } from '../../user/store/useUserStore';
import axios from 'axios';
import {
  ShoppingBag, Search, ShieldCheck, Upload, X, CheckCircle,
  AlertCircle, FileImage, FileVideo, Music, ChevronRight,
  Loader2, Plus, ScrollText, CheckSquare, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

// ─── Submit NFT Modal ─────────────────────────────────────────────────────────
const SubmitNFTModal = ({ onClose, darkMode }) => {
  const [step, setStep] = useState('form'); // 'form' | 'terms' | 'success'
  const [terms, setTerms] = useState('');
  const [termsLoading, setTermsLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewType, setPreviewType] = useState('image');
  const fileRef = useRef();

  const [form, setForm] = useState({
    title: '',
    description: '',
    basePrice: '',
    royaltyPct: '10',
    file: null,
    proofVideo: null,
  });

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(prev => ({ ...prev, file }));
    const url = URL.createObjectURL(file);
    setPreview(url);
    if (file.type.startsWith('video/')) setPreviewType('video');
    else if (file.type.startsWith('audio/')) setPreviewType('audio');
    else setPreviewType('image');
  };

  const handleProofVideo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(prev => ({ ...prev, proofVideo: file }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setForm(prev => ({ ...prev, file }));
    const url = URL.createObjectURL(file);
    setPreview(url);
    if (file.type.startsWith('video/')) setPreviewType('video');
    else if (file.type.startsWith('audio/')) setPreviewType('audio');
    else setPreviewType('image');
  };

  const proceedToTerms = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.basePrice || !form.file) {
      setError('Please fill in all fields and upload a media file.');
      return;
    }
    setError('');
    setTermsLoading(true);
    try {
      const res = await axios.get('/api/nft/terms');
      if (res.data.success) setTerms(res.data.terms);
    } catch {
      setTerms('Unable to load terms. Please try again.');
    } finally {
      setTermsLoading(false);
      setStep('terms');
    }
  };

  const handleSubmit = async () => {
    if (!accepted) return;
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('basePrice', form.basePrice);
      fd.append('royaltyPct', form.royaltyPct);
      fd.append('termsAccepted', 'true');
      fd.append('media', form.file);
      if (form.proofVideo) {
        fd.append('proofVideo', form.proofVideo);
      }

      const token = getStoredToken();
      await axios.post('/api/nft/submit', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className={`w-full sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col ${
          darkMode ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-gray-100'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-zinc-800' : 'border-gray-100'} sticky top-0 ${darkMode ? 'bg-zinc-900' : 'bg-white'} z-10`}>
          <div className="flex items-center gap-3">
            {step === 'form' && <Upload className="w-5 h-5 text-yellow-500" />}
            {step === 'terms' && <ScrollText className="w-5 h-5 text-yellow-500" />}
            {step === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            <h2 className="font-bold text-base">
              {step === 'form' && 'Submit Your NFT'}
              {step === 'terms' && 'Terms & Conditions'}
              {step === 'success' && 'NFT Submitted!'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {step !== 'success' && (
          <div className="flex gap-0 px-6 pt-4">
            {['form', 'terms'].map((s, idx) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s
                      ? 'bg-yellow-500 text-black'
                      : step === 'terms' && idx === 0
                      ? 'bg-green-500 text-white'
                      : darkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step === 'terms' && idx === 0 ? '✓' : idx + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{s === 'form' ? 'Details' : 'Review & Accept'}</span>
                </div>
                {idx === 0 && (
                  <div className={`flex-1 h-0.5 my-auto mx-2 rounded ${step === 'terms' ? 'bg-yellow-500' : darkMode ? 'bg-zinc-700' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="p-6 flex flex-col gap-5 flex-1">
          {/* STEP 1: Form */}
          {step === 'form' && (
            <>
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className={`relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${
                  preview
                    ? 'border-yellow-500/50'
                    : darkMode
                    ? 'border-zinc-700 hover:border-yellow-500/50 bg-zinc-800'
                    : 'border-gray-200 hover:border-yellow-400 bg-gray-50'
                }`}
              >
                {preview ? (
                  <>
                    {previewType === 'video' && (
                      <video src={preview} className="w-full h-full object-cover rounded-2xl" muted />
                    )}
                    {previewType === 'image' && (
                      <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                    )}
                    {previewType === 'audio' && (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <Music className="w-10 h-10 text-yellow-500" />
                        <audio src={preview} controls className="w-48" />
                        <p className="text-xs text-gray-500">{form.file?.name}</p>
                      </div>
                    )}
                    <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-2xl ${darkMode ? 'bg-black/60' : 'bg-white/70'}`}>
                      <p className="text-sm font-semibold">Click to change</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center px-4">
                    <div className="flex gap-3">
                      <FileImage className="w-7 h-7 text-yellow-500" />
                      <FileVideo className="w-7 h-7 text-yellow-500" />
                      <Music className="w-7 h-7 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">Drop your NFT media here</p>
                      <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                        Image, Video, or Audio • Max 500MB
                      </p>
                    </div>
                    <span className="px-4 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-full">
                      Browse Files
                    </span>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" onChange={handleFile} className="hidden" />
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                  NFT Title *
                </label>
                <input
                  type="text"
                  placeholder="Give your NFT a name..."
                  value={form.title}
                  onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500/40 text-sm transition-all ${
                    darkMode
                      ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600'
                      : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'
                  }`}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                  Description *
                </label>
                <textarea
                  placeholder="Describe your NFT..."
                  value={form.description}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500/40 text-sm resize-none transition-all ${
                    darkMode
                      ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600'
                      : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'
                  }`}
                />
              </div>

              {/* Price & Royalty */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Base Price (Coins) *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={form.basePrice}
                    min="1"
                    onChange={(e) => setForm(p => ({ ...p, basePrice: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500/40 text-sm transition-all ${
                      darkMode
                        ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600'
                        : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Royalty %
                  </label>
                  <input
                    type="number"
                    placeholder="10"
                    value={form.royaltyPct}
                    min="0"
                    max="30"
                    onChange={(e) => setForm(p => ({ ...p, royaltyPct: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-yellow-500/40 text-sm transition-all ${
                      darkMode
                        ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600'
                        : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'
                    }`}
                  />
                </div>
              </div>

              {/* Proof Video (Optional) */}
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                  Proof Video (Optional)
                </label>
                <div
                  onClick={() => proofFileRef.current?.click()}
                  className={`w-full px-4 py-3 rounded-xl border border-dashed flex items-center justify-between cursor-pointer transition-all ${
                    darkMode
                      ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <span className={`truncate text-sm ${form.proofVideo ? (darkMode ? 'text-white' : 'text-black') : (darkMode ? 'text-zinc-500' : 'text-gray-400')}`}>
                    {form.proofVideo ? form.proofVideo.name : 'Upload a video to build trust...'}
                  </span>
                  <FileVideo className="w-5 h-5 text-yellow-500" />
                </div>
                <input ref={proofFileRef} type="file" accept="video/*" onChange={handleProofVideo} className="hidden" />
                <p className={`text-[10px] ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                  Upload a short video of you creating or explaining this NFT to verify authenticity.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={proceedToTerms}
                className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
              >
                Continue to Terms <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* STEP 2: Terms */}
          {step === 'terms' && (
            <>
              {termsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                </div>
              ) : (
                <>
                  <div className={`rounded-2xl border p-5 max-h-64 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-amber-50 border-amber-200 text-gray-700'
                  }`}>
                    {terms}
                  </div>

                  {/* Accept checkbox */}
                  <button
                    onClick={() => setAccepted(p => !p)}
                    className="flex items-start gap-3 text-sm font-medium text-left w-full group"
                  >
                    <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      accepted
                        ? 'bg-yellow-500 border-yellow-500'
                        : darkMode
                        ? 'border-zinc-600 group-hover:border-yellow-500'
                        : 'border-gray-300 group-hover:border-yellow-500'
                    }`}>
                      {accepted && <span className="text-black text-xs font-bold">✓</span>}
                    </div>
                    <span className={darkMode ? 'text-zinc-300' : 'text-gray-700'}>
                      I have read, understood, and agree to the terms and conditions above. I confirm that this NFT is my original creation.
                    </span>
                  </button>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('form')}
                      className={`flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                        darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!accepted || submitting}
                      className="flex-2 flex-1 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20"
                    >
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                      ) : (
                        <><Upload className="w-4 h-4" /> Submit NFT</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* STEP 3: Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center text-center gap-5 py-6">
              <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">NFT Submitted! 🎉</h3>
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                  Your NFT has been submitted for review. Once the admin verifies it, your collectible will go <span className="text-yellow-500 font-semibold">live in the marketplace</span> for everyone to see and bid.
                </p>
              </div>
              <div className={`w-full p-4 rounded-xl border flex gap-3 text-sm text-left ${
                darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-amber-50 border-amber-200'
              }`}>
                <ShieldCheck className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className={darkMode ? 'text-zinc-400' : 'text-gray-600'}>
                  You'll be notified once your NFT is approved or if any changes are needed.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-amber-400 transition-all"
              >
                Back to Marketplace
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const NFTMarketplacePage = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

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

          {/* Submit NFT Button in Hero */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setShowSubmitModal(true)}
            className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-full hover:from-yellow-400 hover:to-amber-400 transition-all shadow-lg shadow-yellow-500/30 text-sm"
          >
            <Plus className="w-4 h-4" />
            Submit Your NFT
          </motion.button>
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

            {/* Submit button in toolbar (secondary) */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10`}
            >
              <Upload className="w-3.5 h-3.5" /> Submit NFT
            </button>
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
                      onMouseOut={e => { e.target.pause(); e.target.currentTime = 0; }}
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
            <p className="text-gray-500 mb-6">Try changing your filters or check back later.</p>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-full hover:from-yellow-400 hover:to-amber-400 transition-all"
            >
              <Upload className="w-4 h-4" /> Be the first to submit an NFT
            </button>
          </div>
        )}
      </div>

      {/* Submit NFT Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <SubmitNFTModal onClose={() => setShowSubmitModal(false)} darkMode={darkMode} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NFTMarketplacePage;

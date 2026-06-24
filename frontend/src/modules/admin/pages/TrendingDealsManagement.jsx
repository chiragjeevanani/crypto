import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, Plus, Play, Loader2, DollarSign, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredToken } from '../../user/store/useUserStore';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function TrendingDealsManagement() {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    
    // Form fields
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [link, setLink] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaType, setMediaType] = useState('video');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchDeals();
    }, []);

    const getAuthHeaders = () => {
        const token = getStoredToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    const fetchDeals = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/deals`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                setDeals(data.deals || []);
            }
        } catch (err) {
            console.error('Failed to fetch deals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMediaUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingMedia(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_BASE}/admin/media/upload`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setMediaUrl(data.url);
                setMediaType(data.type || (file.type.startsWith('video/') ? 'video' : 'image'));
                setSuccessMessage('Media uploaded successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(data.message || 'Failed to upload media');
            }
        } catch (err) {
            setError('Error uploading media. Please check your network.');
        } finally {
            setUploadingMedia(false);
        }
    };

    const handleCreateDeal = async (e) => {
        e.preventDefault();
        if (!title || !mediaUrl) {
            setError('Title and Media file are required.');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/admin/deals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    title,
                    price: Number(price) || 0,
                    mediaUrl,
                    mediaType,
                    link
                })
            });
            const data = await res.json();
            if (data.success) {
                setTitle('');
                setPrice('');
                setLink('');
                setMediaUrl('');
                setMediaType('video');
                setSuccessMessage('Deal added successfully!');
                fetchDeals();
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(data.message || 'Failed to create deal');
            }
        } catch (err) {
            setError('Network error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteDeal = async (id) => {
        if (!window.confirm('Are you sure you want to delete this trending deal?')) return;
        try {
            const res = await fetch(`${API_BASE}/admin/deals/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                setSuccessMessage('Deal deleted!');
                fetchDeals();
                setTimeout(() => setSuccessMessage(''), 2000);
            }
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Sparkles className="text-primary w-8 h-8" />
                    Trending Deals Management
                </h1>
                <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mt-1">
                    Upload marketing post videos to feature them on the Marketplace Discover screen
                </p>
            </div>

            {/* Notification Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold uppercase tracking-wider rounded-xl"
                    >
                        {error}
                    </motion.div>
                )}
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider rounded-xl"
                    >
                        {successMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Form */}
                <div className="bg-surface border border-surface rounded-2xl p-6 h-fit space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted flex items-center gap-2">
                        <Plus size={16} /> Add Trending Deal
                    </h2>
                    
                    <form onSubmit={handleCreateDeal} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Deal Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Rare Collectible Deal"
                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Display Price (₹ / USD)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="e.g., 500"
                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Target Action Link (Optional)</label>
                            <input
                                type="text"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="e.g., /tasks?view=nft"
                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Deal Video / Image</label>
                            <div className="relative border-2 border-dashed border-surface rounded-xl p-6 bg-bg/50 hover:bg-bg transition-all flex flex-col items-center justify-center text-center cursor-pointer">
                                <input
                                    type="file"
                                    accept="video/*,image/*"
                                    onChange={handleMediaUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    disabled={uploadingMedia || submitting}
                                />
                                {uploadingMedia ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                        <span className="text-[10px] font-bold uppercase text-muted tracking-wider">Uploading file...</span>
                                    </div>
                                ) : mediaUrl ? (
                                    <div className="space-y-2">
                                        <span className="text-emerald-500 font-bold text-xs">✓ File Uploaded</span>
                                        <p className="text-[9px] text-muted truncate max-w-[200px]">{mediaUrl}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Choose File</span>
                                        <p className="text-[8px] text-muted">Supports MP4, WebM, PNG, JPG (Max 50MB)</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || uploadingMedia || !mediaUrl}
                            className="w-full bg-primary text-black py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/95 transition-all disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                            {submitting ? 'Creating...' : 'Create Deal'}
                        </button>
                    </form>
                </div>

                {/* List View */}
                <div className="bg-surface border border-surface rounded-2xl p-6 lg:col-span-2 space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted">
                        Active Deals List ({deals.length})
                    </h2>

                    {loading ? (
                        <div className="py-12 text-center text-muted uppercase font-bold text-xs tracking-widest flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading deals...
                        </div>
                    ) : deals.length === 0 ? (
                        <div className="py-12 text-center text-muted uppercase font-bold text-[10px] tracking-wider border border-dashed border-surface rounded-xl">
                            No trending deals found. Add one on the left panel!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {deals.map((deal) => (
                                <motion.div
                                    key={deal._id || deal.id}
                                    layout
                                    className="bg-bg border border-surface rounded-xl overflow-hidden shadow-md flex flex-col justify-between"
                                >
                                    <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                                        {deal.media?.type === 'video' ? (
                                            <video
                                                src={deal.media?.url}
                                                className="w-full h-full object-cover"
                                                muted
                                                loop
                                                autoPlay
                                                playsInline
                                            />
                                        ) : (
                                            <img
                                                src={deal.media?.url}
                                                alt={deal.title}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        {deal.media?.type === 'video' && (
                                            <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white">
                                                <Play size={12} className="fill-current" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 space-y-3">
                                        <div>
                                            <h3 className="font-extrabold text-sm text-text line-clamp-1 uppercase tracking-tight">
                                                {deal.title}
                                            </h3>
                                            <p className="text-[10px] font-bold text-primary mt-1 flex items-center gap-1">
                                                {deal.price ? `₹${deal.price}` : 'Free'}
                                            </p>
                                        </div>

                                        {deal.link && (
                                            <a
                                                href={deal.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[9px] font-bold text-muted hover:text-primary flex items-center gap-1 uppercase tracking-wider"
                                            >
                                                <ExternalLink size={10} /> {deal.link}
                                            </a>
                                        )}

                                        <div className="pt-2 border-t border-surface/50 flex justify-end">
                                            <button
                                                onClick={() => handleDeleteDeal(deal._id || deal.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all"
                                            >
                                                <Trash2 size={12} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

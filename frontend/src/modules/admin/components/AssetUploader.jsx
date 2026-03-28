import React, { useState } from 'react';
import { Upload, Trash2, Eye, CheckCircle2, Image as ImageIcon, Play, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { campaignService } from '../services/campaignService';
import { useModalStore } from '../../user/store/useModalStore';

export default function AssetUploader({ assets = [], onChange, maxAssets = 10 }) {
    const [dragActive, setDragActive] = useState(false);
    const [previewAsset, setPreviewAsset] = useState(null);
    const [uploading, setUploading] = useState(false);
    const { showAlert } = useModalStore();

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = [...e.dataTransfer.files];
        handleFiles(files);
    };

    const handleInput = (e) => {
        const files = [...e.target.files];
        handleFiles(files);
    };

    const handleFiles = async (files) => {
        const validFiles = files.filter(file => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            return (isImage || isVideo) && file.size < 100 * 1024 * 1024; // 100MB limit
        });

        if (validFiles.length === 0) return;

        setUploading(true);
        const newAssets = [...assets];

        for (const file of validFiles) {
            if (newAssets.length < maxAssets) {
                try {
                    // Show a local placeholder/preview first
                    const tempId = Date.now() + Math.random();
                    const reader = new FileReader();
                    
                    // We upload to server immediately
                    const res = await campaignService.uploadMedia(file);
                    
                    if (res.success) {
                        const newAsset = {
                            id: tempId,
                            name: file.name,
                            type: res.type || (file.type.startsWith('image/') ? 'image' : 'video'),
                            url: res.url,
                            size: file.size,
                            isPrimary: newAssets.length === 0,
                        };
                        newAssets.push(newAsset);
                    }
                } catch (err) {
                    console.error('File upload failed:', err);
                    alert(`Failed to upload ${file.name}: ${err.message}`);
                }
            }
        }
        
        onChange(newAssets);
        setUploading(false);
    };

    const deleteAsset = (id) => {
        const remaining = assets.filter(a => a.id !== id);
        // If deleted primary, set first as primary
        if (remaining.length > 0 && !remaining.some(a => a.isPrimary)) {
            remaining[0].isPrimary = true;
        }
        onChange(remaining);
    };

    const setPrimary = (id) => {
        onChange(assets.map(a => ({
            ...a,
            isPrimary: a.id === id
        })));
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                    🎨 Ad Creatives ({assets.length}/{maxAssets})
                </h3>
            </div>

            {/* Upload Area */}
            <motion.div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                animate={{ borderColor: dragActive ? 'rgb(59, 130, 246)' : 'var(--color-border)' }}
                className="relative p-8 border-2 border-dashed rounded-lg bg-surface/30 cursor-pointer transition-all hover:border-primary"
            >
                <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleInput}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center text-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                        {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-text uppercase tracking-wider">
                            {uploading ? 'Finalizing Upload...' : 'Drag files here or click to upload'}
                        </p>
                        <p className="text-[9px] text-muted mt-1">
                            Images (JPG, PNG, WebP) or Videos (MP4, WebM) • Max 100MB
                        </p>
                        <div className="mt-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                            <p className="text-[9px] font-bold text-primary uppercase tracking-wider">
                                💡 Recommended for Banners
                            </p>
                            <p className="text-[8px] text-muted mt-0.5">
                                Aspect Ratio: 16:9 or 2:1 (e.g., 1280x720px) <br/>
                                This ensures your campaign looks perfect on mobile and desktop.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Assets Grid */}
            <div className="grid grid-cols-2 gap-3">
                {assets.map((asset) => (
                    <motion.div
                        key={asset.id}
                        layout
                        className="relative group rounded-lg overflow-hidden bg-bg border border-surface"
                    >
                        {/* Asset Preview */}
                        <div className="relative w-full aspect-video bg-bg overflow-hidden">
                            {asset.type === 'image' ? (
                                <img
                                    src={asset.url}
                                    alt={asset.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-surface">
                                    <Play className="w-8 h-8 text-muted" />
                                </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                <button
                                    onClick={() => setPreviewAsset(asset)}
                                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-all"
                                    title="Preview"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => deleteAsset(asset.id)}
                                    className="p-2 bg-rose-500/20 hover:bg-rose-500/40 rounded-lg text-rose-300 transition-all"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Primary Badge */}
                            {asset.isPrimary && (
                                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white rounded text-[8px] font-bold uppercase">
                                    <CheckCircle2 className="w-3 h-3" /> Primary
                                </div>
                            )}
                        </div>

                        {/* Asset Info */}
                        <div className="p-3 space-y-2 border-t border-surface">
                            <p className="text-[9px] font-semibold text-text truncate">
                                {asset.name}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[8px] text-muted">
                                    {asset.type.toUpperCase()} • {formatFileSize(asset.size)}
                                </span>
                                {!asset.isPrimary && (
                                    <button
                                        onClick={() => setPrimary(asset.id)}
                                        className="text-[8px] px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-all font-bold uppercase tracking-wider"
                                    >
                                        Make Primary
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {assets.length === 0 && (
                <div className="p-6 text-center bg-surface/30 rounded-lg border border-dashed border-surface">
                    <ImageIcon className="w-6 h-6 text-muted mx-auto mb-2 opacity-50" />
                    <p className="text-[10px] text-muted font-medium uppercase">No assets uploaded yet</p>
                </div>
            )}

            {/* Preview Modal */}
            <AnimatePresence>
                {previewAsset && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreviewAsset(null)}
                        className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-2xl w-full bg-bg rounded-lg overflow-hidden"
                        >
                            {previewAsset.type === 'image' ? (
                                <img
                                    src={previewAsset.url}
                                    alt={previewAsset.name}
                                    className="w-full"
                                />
                            ) : (
                                <video
                                    src={previewAsset.url}
                                    controls
                                    className="w-full"
                                />
                            )}
                            <div className="p-4 border-t border-surface flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-semibold text-text">{previewAsset.name}</p>
                                    <p className="text-[9px] text-muted">{formatFileSize(previewAsset.size)}</p>
                                </div>
                                <button
                                    onClick={() => setPreviewAsset(null)}
                                    className="px-3 py-1.5 bg-surface rounded text-[9px] font-bold uppercase tracking-wider text-muted hover:text-text transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Save } from 'lucide-react';
import ImageEditor from './ImageEditor';
import VideoEditor from './VideoEditor';

const EditorModal = ({ file, type, onClose, onSave }) => {
    if (!file) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[200] flex flex-col bg-black text-white"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-900 text-zinc-400 hover:text-white transition-all active:scale-95"
                        >
                            <X size={22} />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-sm font-bold tracking-tight text-white uppercase">Editor</h2>
                            <p className="text-[10px] text-zinc-400 font-medium">{type === 'video' ? 'Advanced Video Processing' : 'Pixel-Perfect Image Tuning'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]"></div>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Active Session</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                    {type === 'image' ? (
                        <ImageEditor file={file} onSave={onSave} />
                    ) : (
                        <VideoEditor file={file} onSave={onSave} />
                    )}
                </div>

                {/* Optional Footer (already handled in children, but adding for completeness) */}
            </motion.div>
        </AnimatePresence>
    );
};

export default EditorModal;

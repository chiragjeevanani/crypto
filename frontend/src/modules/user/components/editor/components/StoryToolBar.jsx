import React from 'react';
import { X, Type, PenTool, Hash, Music, Save, Download, SlidersHorizontal, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const StoryToolBar = ({ activeTool, onSelectTool, onClose, onSave, onClearDrawing, onDownload }) => {
    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between"
        >
            <div className="flex items-center gap-4">
                <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/60 active:scale-95 transition-all"
                >
                    <X size={22} />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <button 
                    onClick={() => onSelectTool(activeTool === 'text' ? null : 'text')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                        activeTool === 'text' ? 'bg-white text-black' : 'bg-black/40 backdrop-blur-md text-white border border-white/10'
                    }`}
                >
                    <Type size={20} />
                </button>
                <button 
                    onClick={() => onSelectTool(activeTool === 'draw' ? null : 'draw')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                        activeTool === 'draw' ? 'bg-white text-black' : 'bg-black/40 backdrop-blur-md text-white border border-white/10'
                    }`}
                >
                    <PenTool size={20} />
                </button>
                
                {activeTool === 'draw' && (
                    <button 
                        onClick={onClearDrawing}
                        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-red-400 border border-white/10 flex items-center justify-center active:scale-95"
                    >
                        <Trash2 size={20} />
                    </button>
                )}

                <button 
                    onClick={() => onSelectTool('filters')}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 flex items-center justify-center active:scale-95"
                >
                    <SlidersHorizontal size={20} />
                </button>
                <button 
                    onClick={onDownload}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 flex items-center justify-center active:scale-95"
                >
                    <Download size={20} />
                </button>
            </div>
        </motion.div>
    );
};

export default StoryToolBar;

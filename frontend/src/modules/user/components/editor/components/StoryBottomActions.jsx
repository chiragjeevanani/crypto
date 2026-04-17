import React from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const StoryBottomActions = ({ onApply }) => {
    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 10, opacity: 1 }}
            className="absolute bottom-8 left-0 right-0 z-50 px-6 flex items-center justify-between"
        >
            <div className="flex items-center gap-2 group cursor-pointer active:scale-95 transition-transform">
                <div className="w-12 h-12 rounded-full border-2 border-primary p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                    <div className="w-full h-full rounded-full bg-zinc-900 border-2 border-black flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                            <img 
                                src="https://ui-avatars.com/api/?name=User&background=333&color=fff" 
                                alt="Your Story" 
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">Your story</span>
                    <span className="text-[10px] text-zinc-400">Share to your feed</span>
                </div>
            </div>

            <button 
                onClick={onApply}
                className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black shadow-xl shadow-white/20 active:scale-90 hover:scale-110 transition-all group"
            >
                <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
        </motion.div>
    );
};

export default StoryBottomActions;

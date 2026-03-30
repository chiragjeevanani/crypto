import React from 'react';
import { motion } from 'framer-motion';

export default function ReelSkeleton() {
    return (
        <div className="rounded-2xl bg-zinc-100/50 dark:bg-zinc-800/40 shadow-sm border-none overflow-hidden relative">
            {/* Image area */}
            <div className="aspect-[9/16] bg-surface2/20 relative">
                <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Caption area */}
            <div className="p-3 space-y-2">
                <div className="w-1/2 h-2.5 bg-surface2/50 rounded-full animate-pulse" />
                <div className="w-3/4 h-2 bg-surface2/30 rounded-full animate-pulse" />
            </div>
        </div>
    );
}

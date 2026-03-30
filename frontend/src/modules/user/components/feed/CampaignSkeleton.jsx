import React from 'react';
import { motion } from 'framer-motion';

export default function CampaignSkeleton() {
    return (
        <div className="mx-3 my-6 rounded-[32px] overflow-hidden bg-zinc-100/50 dark:bg-zinc-800/40 shadow-xl border-none">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface2/50 animate-pulse" />
                    <div className="space-y-1.5">
                        <div className="w-20 h-2 bg-surface2/50 rounded-full animate-pulse" />
                        <div className="w-12 h-2 bg-surface2/30 rounded-full animate-pulse" />
                    </div>
                </div>
                <div className="w-14 h-4 bg-surface2/30 rounded-full animate-pulse" />
            </div>

            {/* Media Area */}
            <div className="relative aspect-[16/10] bg-surface2/20 overflow-hidden">
                <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Details Section */}
            <div className="p-6 space-y-4">
                <div className="space-y-2">
                    <div className="w-3/4 h-4 bg-surface2/50 rounded-full animate-pulse" />
                    <div className="space-y-1.5">
                        <div className="w-full h-2 bg-surface2/30 rounded-full animate-pulse" />
                        <div className="w-5/6 h-2 bg-surface2/30 rounded-full animate-pulse" />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-surface bg-surface2/50 animate-pulse" />
                        ))}
                    </div>
                    <div className="w-24 h-10 bg-surface2/50 rounded-2xl animate-pulse" />
                </div>
            </div>
        </div>
    );
}

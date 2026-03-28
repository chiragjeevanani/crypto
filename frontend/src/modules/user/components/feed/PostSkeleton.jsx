import React from 'react';
import { motion } from 'framer-motion';

export default function PostSkeleton() {
    return (
        <div className="rounded-3xl bg-surface/50 border border-surface2/30 overflow-hidden mb-6">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface2/50 animate-pulse" />
                    <div className="space-y-2">
                        <div className="w-24 h-3 bg-surface2/50 rounded-full animate-pulse" />
                        <div className="w-16 h-2 bg-surface2/30 rounded-full animate-pulse" />
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-surface2/30 animate-pulse" />
            </div>

            {/* Media Area */}
            <div className="aspect-[4/5] bg-surface2/20 relative overflow-hidden">
                <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    animate={{ 
                        x: ['-100%', '100%'] 
                    }}
                    transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        ease: "linear" 
                    }}
                />
            </div>

            {/* Actions */}
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full bg-surface2/50 animate-pulse" />
                        <div className="w-6 h-6 rounded-full bg-surface2/50 animate-pulse" />
                        <div className="w-6 h-6 rounded-full bg-surface2/50 animate-pulse" />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-surface2/50 animate-pulse" />
                </div>

                {/* Caption Skeleton */}
                <div className="space-y-2">
                    <div className="w-3/4 h-3 bg-surface2/50 rounded-full animate-pulse" />
                    <div className="w-1/2 h-3 bg-surface2/30 rounded-full animate-pulse" />
                </div>
            </div>
        </div>
    );
}

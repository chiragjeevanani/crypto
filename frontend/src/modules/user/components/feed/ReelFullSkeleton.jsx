import React from 'react';
import { motion } from 'framer-motion';

export default function ReelFullSkeleton() {
    return (
        <div className="relative w-full h-[100dvh] bg-[#111] overflow-hidden flex flex-col justify-end">
            {/* Main Background Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 to-neutral-800 animate-pulse" />

            {/* Right Side Action Buttons */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-6 z-10">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 rounded-full bg-neutral-700/60 animate-pulse shadow-xl" />
                        <div className="w-6 h-2 bg-neutral-800/40 rounded animate-pulse" />
                    </div>
                ))}
            </div>

            {/* Bottom Content Area */}
            <div className="p-4 pb-12 space-y-4 z-10 relative">
                <div className="flex items-center gap-3">
                    {/* Profile Icon */}
                    <div className="w-10 h-10 rounded-full bg-neutral-700/80 animate-pulse border border-neutral-600" />
                    <div className="space-y-2">
                        {/* Username */}
                        <div className="w-32 h-3 bg-neutral-700/80 rounded animate-pulse" />
                        {/* Meta/Description */}
                        <div className="w-24 h-2 bg-neutral-800/50 rounded animate-pulse" />
                    </div>
                </div>

                {/* Caption Placeholder */}
                <div className="space-y-2 max-w-[80%]">
                    <div className="w-full h-3 bg-neutral-700/40 rounded animate-pulse" />
                    <div className="w-3/4 h-3 bg-neutral-700/30 rounded animate-pulse" />
                </div>

                {/* Tags/Gifts Row */}
                <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-14 h-7 rounded-full bg-neutral-800/60 animate-pulse border border-neutral-700/30" />
                    ))}
                </div>
            </div>

            {/* Top Back Button Shimmer */}
            <div className="absolute top-4 left-4 z-10">
                <div className="w-8 h-8 rounded-full bg-neutral-800/40 animate-pulse flex items-center justify-center">
                    <div className="w-4 h-4 bg-neutral-700 rounded-sm" />
                </div>
            </div>
            
            {/* Progress Bar Shimmer */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-neutral-800">
                <div className="h-full w-1/3 bg-neutral-600 animate-pulse" />
            </div>
        </div>
    );
}

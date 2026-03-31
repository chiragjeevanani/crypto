import React from 'react'

export function SearchShimmer() {
    return (
        <div className="space-y-8 animate-shimmer">
            {/* Account shimmer */}
            <div>
                <div className="w-24 h-4 mb-4 bg-surface2/50 rounded" />
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div 
                            key={i} 
                            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface"
                            style={{ border: 'none' }}
                        >
                            <div className="w-11 h-11 rounded-full bg-surface2/50" />
                            <div className="flex-1 space-y-2">
                                <div className="w-32 h-3 bg-surface2/50 rounded" />
                                <div className="w-20 h-2 bg-surface2/30 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reel Grid shimmer */}
            <div>
                <div className="w-24 h-4 mb-4 bg-surface2/50 rounded" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div 
                            key={i} 
                            className="overflow-hidden rounded-2xl bg-surface"
                            style={{ border: 'none' }}
                        >
                            <div className="w-full aspect-square bg-surface2/60" />
                            <div className="p-3 space-y-2">
                                <div className="w-20 h-3 bg-surface2/50 rounded" />
                                <div className="w-28 h-2 bg-surface2/30 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

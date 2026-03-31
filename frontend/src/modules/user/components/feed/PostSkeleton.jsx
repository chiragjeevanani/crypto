import React from 'react';

export default function PostSkeleton() {
    return (
        <div className="overflow-hidden mb-6 bg-surface animate-shimmer" style={{ border: 'none' }}>
            {/* Header */}
            <div className="p-4 flex items-center justify-between" style={{ background: 'var(--color-surface)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface2/50" />
                    <div className="space-y-1.5">
                        <div className="w-24 h-3 bg-surface2/50 rounded" />
                        <div className="w-16 h-2 bg-surface2/30 rounded" />
                    </div>
                </div>
            </div>

            {/* Media Area */}
            <div className="w-full post-media-aspect" />

            {/* Actions */}
            <div className="p-4 space-y-4" style={{ background: 'var(--color-surface)' }}>
                <div className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-surface2/50" />
                    <div className="w-6 h-6 rounded-full bg-surface2/50" />
                    <div className="w-6 h-6 rounded-full bg-surface2/50" />
                </div>
                <div className="space-y-2">
                    <div className="w-3/4 h-3 bg-surface2/50 rounded" />
                    <div className="w-1/2 h-2 bg-surface2/30 rounded" />
                </div>
            </div>
        </div>
    );
}

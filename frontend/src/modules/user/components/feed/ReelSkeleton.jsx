import React from 'react';

export default function ReelSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl bg-surface animate-shimmer" style={{ border: 'none' }}>
            <div className="w-full aspect-square" />
            <div className="p-2.5 space-y-1.5" style={{ background: 'var(--color-surface)' }}>
                <div className="w-1/2 h-3 bg-surface2/60 rounded" />
                <div className="w-3/4 h-2 bg-surface2/30 rounded" />
            </div>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { Gift, Search, ArrowRight, Video, PlayCircle, Clock } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPageHeader, AdminDataTable } from '../components/shared';

export default function GiftHistory() {
    const { giftHistory, loadGiftHistory, isLoading } = useAdminStore();
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadGiftHistory();
    }, [loadGiftHistory]);

    // Safety check: ensure giftHistory is an array
    const historyList = Array.isArray(giftHistory) ? giftHistory : [];

    const filtered = historyList.filter(h => {
        const sender = (h.sender || "").toLowerCase();
        const receiver = (h.receiver || "").toLowerCase();
        const asset = (h.giftName || "").toLowerCase();
        const searchTerm = search.toLowerCase();

        return sender.includes(searchTerm) ||
               receiver.includes(searchTerm) ||
               asset.includes(searchTerm);
    });

    return (
        <div className="space-y-8 pb-20">
            <AdminPageHeader 
                title="Monetary Gift Stream" 
                subtitle="Live audit of peer-to-peer asset transfers across the network."
            />

            <AdminDataTable 
                title="Universal Gift Ledger"
                onSearch={setSearch}
                columns={["Timestamp", "Sender", "Recipient", "Asset", "Value", "Context"]}
                isLoading={isLoading}
                data={filtered.map(h => ({
                    id: h.id,
                    cells: [
                        <div className="flex items-center gap-2 text-[10px] font-mono text-muted">
                            <Clock className="w-3 h-3" />
                            {h.date ? new Date(h.date).toLocaleString() : 'N/A'}
                        </div>,
                        <span className="text-xs font-bold text-text">{h.sender || 'Unknown'}</span>,
                        <div className="flex items-center gap-2">
                             <span className="text-xs font-bold text-primary">{h.receiver || 'Unknown'}</span>
                        </div>,
                        <div className="flex items-center gap-2">
                             <span className="text-lg">{h.giftIcon || '🎁'}</span>
                             <span className="text-[10px] font-bold uppercase tracking-widest text-text">{h.giftName || 'Gift'}</span>
                        </div>,
                        <span className="text-xs font-bold text-emerald-500">{h.coins || 0} Coins</span>,
                        <div className="flex gap-2">
                            {h.postId && (
                                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[8px] font-bold uppercase flex items-center gap-1">
                                    <Video className="w-2.5 h-2.5" /> Post
                                </span>
                            )}
                            {h.reelId && (
                                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 text-[8px] font-bold uppercase flex items-center gap-1">
                                    <PlayCircle className="w-2.5 h-2.5" /> Reel
                                </span>
                            )}
                        </div>
                    ]
                }))}
            />
        </div>
    );
}

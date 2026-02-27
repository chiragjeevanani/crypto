import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trash2,
    RotateCcw,
    XCircle,
    AlertCircle,
    Info,
    History,
    FileText,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPageHeader, AdminDataTable } from '../components/shared';
import { formatCurrency } from '../utils/currency';

export default function GiftTrash() {
    const { trashGifts, loadTrashGifts, restoreGift, permanentlyDeleteGift, isLoading } = useAdminStore();
    const navigate = useNavigate();

    useEffect(() => {
        loadTrashGifts();
    }, [loadTrashGifts]);

    const handleRestore = async (id) => {
        if (confirm('Restore this gift to active registry?')) {
            await restoreGift(id);
        }
    };

    const handlePermanentDelete = async (id) => {
        if (confirm('PERMANENT ERASURE: This action cannot be undone and will remove the gift from the node network. Continue?')) {
            await permanentlyDeleteGift(id);
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Gift Archives (Trash)"
                subtitle="Manage deleted gift protocols. Restore or permanently erase assets."
                actions={
                    <button
                        onClick={() => navigate('/admin/gifts')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Registry
                    </button>
                }
            />

            <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl flex items-start gap-4 mb-6">
                <AlertCircle className="text-rose-500 w-5 h-5 shrink-0" />
                <div>
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em] mb-1">Administrative Warning</p>
                    <p className="text-[10px] text-rose-500/60 font-medium leading-relaxed uppercase tracking-wider">
                        Assets in this archive are currently disconnected from the main liquid exchange. Permanent erasure results in irreversible data loss across all nodes.
                    </p>
                </div>
            </div>

            <AdminDataTable
                title="Archived Assets"
                columns={["Gift", "Price", "Deleted At", "Last Usage", "Actions"]}
                data={trashGifts.map(gift => ({
                    id: gift.id,
                    cells: [
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{gift.icon}</span>
                            <div>
                                <p className="text-xs font-bold text-text">{gift.name}</p>
                                <p className="text-[9px] text-muted font-bold uppercase tracking-wider">ID: {gift.id}</p>
                            </div>
                        </div>,
                        <span className="text-[10px] font-bold text-text">{formatCurrency(gift.price)}</span>,
                        <span className="text-[10px] text-muted font-medium uppercase">{new Date(gift.deletedAt).toLocaleString()}</span>,
                        <span className="text-[10px] font-bold text-text">{gift.usage} Records</span>,
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleRestore(gift.id)}
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-lg transition-all"
                                title="Restore to Registry"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handlePermanentDelete(gift.id)}
                                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-lg transition-all"
                                title="Permanently Erase"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    ]
                }))}
            />

            {trashGifts.length === 0 && !isLoading && (
                <div className="py-20 text-center border border-dashed border-surface rounded-2xl bg-surface2/30">
                    <Trash2 className="w-12 h-12 mx-auto mb-4 text-muted opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Archive is empty</p>
                </div>
            )}
        </div>
    );
}

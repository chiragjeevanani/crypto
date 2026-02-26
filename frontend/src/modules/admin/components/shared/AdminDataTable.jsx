import React from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';

export default function AdminDataTable({
    title,
    columns = [],
    data = [],
    onSearch,
    onRowClick,
    searchPlaceholder = "Find in ledger...",
    isLoading = false
}) {
    return (
        <div className="bg-surface border border-surface rounded-lg overflow-hidden shadow-sm">
            {/* Table Header Controls */}
            {(title || onSearch) && (
                <div className="p-5 border-b border-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/50">
                    {title && (
                        <div>
                            <h3 className="text-[11px] font-bold tracking-widest text-text uppercase">{title}</h3>
                            <p className="text-[9px] text-muted font-medium uppercase tracking-wider mt-0.5 opacity-60">System Registry Data</p>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                onChange={(e) => onSearch?.(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="bg-bg border border-surface rounded-lg py-1.5 pl-9 pr-4 text-[11px] font-medium focus:ring-1 focus:ring-primary/20 outline-none w-full sm:w-64 text-text transition-all placeholder:text-muted/40"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Table Area */}
            <div className="overflow-x-auto selection:bg-primary/20">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-surface2/40 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-surface">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className="px-6 py-4 font-bold">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface/50">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-6 h-6 text-primary animate-spin opacity-50" />
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Synchronizing Engine...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-20 text-center">
                                    <p className="text-[11px] font-semibold text-muted uppercase tracking-wider opacity-40 italic">Null Data Set Returned</p>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIdx) => (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: rowIdx * 0.03 }}
                                    key={row.id || rowIdx}
                                    onClick={() => onRowClick?.(data[rowIdx], rowIdx)}
                                    className={`transition-colors group ${onRowClick ? 'cursor-pointer hover:bg-primary/[0.04]' : 'hover:bg-primary/[0.02]'}`}
                                >
                                    {row.cells.map((cell, cellIdx) => (
                                        <td key={cellIdx} className="px-6 py-4 text-text font-medium border-b border-transparent group-hover:border-primary/5 transition-all">
                                            {cell}
                                        </td>
                                    ))}
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Pagination Placeholder */}
            <div className="p-4 bg-surface/30 border-t border-surface flex justify-between items-center px-6">
                <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-40">Entry: {data.length} Total</p>
                <button className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-primary transition-all flex items-center gap-2 group">
                    View Complete Registry <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </div>
        </div>
    );
}

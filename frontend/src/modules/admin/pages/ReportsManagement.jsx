import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AlertCircle, 
    ShieldAlert, 
    CheckCircle2, 
    XCircle, 
    X,
    Eye, 
    MessageSquare,
    User,
    Clock,
    Filter,
    ShieldOff,
    Music
} from 'lucide-react';
import { AdminPageHeader, AdminStatCard, AdminDataTable } from '../components/shared';
import { useAdminStore } from '../store/useAdminStore';
import { optimizeCloudinaryUrl } from "../../../utils/mediaOptimization";

const Trash2 = ({ size, className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
);

export default function ReportsManagement() {
    const { reports, loadReports, handleReportAction, isLoading, notify } = useAdminStore();
    const [filter, setFilter] = useState('pending');
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    const filteredReports = reports.filter(r => {
        if (filter === 'all') return true;
        if (filter === 'resolved') return r.status === 'resolved' || r.status === 'ignored';
        return r.status === filter;
    });

    const stats = {
        total: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        resolved: reports.filter(r => r.status === 'resolved' || r.status === 'ignored').length
    };

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Trust & Safety"
                subtitle="Manage user-submitted reports and enforce community guidelines."
                actions={
                    <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider text-text">
                        <Filter className="w-3.5 h-3.5" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-transparent outline-none text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
                        >
                            <option value="all">All Reports</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="ignored">Ignored</option>
                        </select>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => setFilter('all')} className="cursor-pointer group">
                    <AdminStatCard 
                        label="Total Reports" 
                        value={stats.total} 
                        icon={AlertCircle} 
                        color="primary" 
                        className={filter === 'all' ? 'ring-2 ring-primary' : ''}
                    />
                </div>
                <div onClick={() => setFilter('pending')} className="cursor-pointer group">
                    <AdminStatCard 
                        label="Pending Review" 
                        value={stats.pending} 
                        icon={ShieldAlert} 
                        color="rose-500" 
                        className={filter === 'pending' ? 'ring-2 ring-rose-500' : ''}
                    />
                </div>
                <div onClick={() => setFilter('resolved')} className="cursor-pointer group">
                    <AdminStatCard 
                        label="Successfully Resolved" 
                        value={stats.resolved} 
                        icon={CheckCircle2} 
                        color="emerald-500" 
                        className={filter === 'resolved' ? 'ring-2 ring-emerald-500' : ''}
                    />
                </div>
            </div>

            <AdminDataTable
                title="Incident Reports Ledger"
                columns={["Report Info", "Reason", "Target Content", "Status", "Actions"]}
                data={filteredReports.map(report => ({
                    id: report.id,
                    cells: [
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-surface2 flex items-center justify-center">
                                    <User size={12} className="text-muted" />
                                </div>
                                <span className="text-xs font-bold text-text">{report.reporter?.displayHandle}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted">
                                <Clock size={10} />
                                {new Date(report.createdAt).toLocaleString()}
                            </div>
                        </div>,
                        <div className="flex flex-col gap-1">
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold uppercase tracking-wider w-fit">
                                {report.reason}
                            </span>
                            {report.description && (
                                <p className="text-[10px] text-muted line-clamp-2 max-w-[200px]">
                                    "{report.description}"
                                </p>
                            )}
                        </div>,
                        report.post ? (
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-surface2 overflow-hidden border border-surface">
                                    <img src={optimizeCloudinaryUrl(report.post.thumbnail, { width: 100 })} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-text truncate max-w-[120px]">
                                        {report.post.caption || 'No caption'}
                                    </span>
                                    <span className="text-[9px] text-muted">By {report.post.creator?.displayHandle}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-muted italic text-xs">
                                <ShieldOff size={14} />
                                Content Removed
                            </div>
                        ),
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                            report.status === 'pending' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            report.status === 'ignored' ? 'bg-surface2 text-muted border-surface' :
                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                            {report.status}
                        </span>,
                        <div className="flex items-center gap-1.5">
                            {report.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => handleReportAction(report.id, 'ignore')}
                                        title="Ignore Report"
                                        className="p-1.5 rounded-md bg-surface2 hover:bg-surface border border-surface transition-all"
                                    >
                                        <XCircle className="w-3.5 h-3.5 text-muted hover:text-amber-500" />
                                    </button>
                                    <button
                                        onClick={() => handleReportAction(report.id, 'delete')}
                                        title="Reject Post"
                                        className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    </button>
                                </>
                            )}
                                <button
                                    onClick={() => setSelectedReport(report)}
                                    title="View Report Details"
                                    className="p-1.5 rounded-md bg-surface2 hover:bg-surface border border-surface transition-all"
                                >
                                    <Eye className="w-3.5 h-3.5 text-muted" />
                                </button>
                        </div>
                    ]
                }))}
            />

            <AnimatePresence>
                {selectedReport && (
                    <motion.div
                        className="fixed inset-0 z-[140] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div 
                            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                            onClick={() => setSelectedReport(null)} 
                        />
                        <motion.div
                            className="relative w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border"
                            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            {/* Media Section */}
                            <div className="w-full h-[45vh] min-h-[300px] bg-black/5 relative overflow-hidden flex items-center justify-center shrink-0">
                                {selectedReport.post ? (
                                    selectedReport.post.mediaType === 'video' ? (
                                        <video
                                            src={optimizeCloudinaryUrl(selectedReport.post.mediaUrl, { isVideo: true })}
                                            className="w-full h-full object-contain"
                                            controls
                                            autoPlay
                                            crossOrigin="anonymous"
                                        />
                                    ) : selectedReport.post.mediaType === 'audio' ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="p-10 rounded-full bg-surface2/50 backdrop-blur-lg">
                                                <Music size={48} className="text-primary" />
                                            </div>
                                            <audio
                                                src={selectedReport.post.mediaUrl}
                                                controls
                                                className="absolute bottom-4 left-4 right-4"
                                            />
                                        </div>
                                    ) : (
                                        <img
                                            src={optimizeCloudinaryUrl(selectedReport.post.mediaUrl, { width: 1080 })}
                                            className="w-full h-full object-contain"
                                            alt="Reported content"
                                        />
                                    )
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-muted">
                                        <ShieldOff size={48} className="opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-40">Content has been removed</p>
                                    </div>
                                )}
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all z-10"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Info Section */}
                            <div className="p-8 space-y-6 overflow-y-auto flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-surface2 flex items-center justify-center border">
                                            <User size={18} className="text-muted" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black">{selectedReport.post?.creator?.displayHandle || 'System User'}</p>
                                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                                                {selectedReport.post ? 'CONTENT CREATOR' : 'USER IDENTITY'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                                        {selectedReport.reason}
                                    </span>
                                </div>

                                <div className="p-4 rounded-2xl bg-surface2 border">
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-2">Internal Metadata</p>
                                    <p className="text-xs text-text/80 leading-relaxed font-medium italic">
                                        "{selectedReport.post?.caption || 'No caption provided'}"
                                    </p>
                                </div>

                                {selectedReport.description && (
                                    <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                                        <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mb-2">Reporter Description</p>
                                        <p className="text-xs text-text/90 leading-relaxed">
                                            {selectedReport.description}
                                        </p>
                                    </div>
                                )}

                                {selectedReport.status === 'pending' ? (
                                    <div className="flex gap-4 pt-4 border-t border-surface2">
                                        <button
                                            onClick={() => {
                                                handleReportAction(selectedReport.id, 'ignore');
                                                setSelectedReport(null);
                                            }}
                                            className="flex-1 py-4 rounded-2xl font-bold text-xs bg-surface2 hover:brightness-95 transition-all text-text uppercase tracking-widest"
                                        >
                                            Ignore Report
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleReportAction(selectedReport.id, 'delete');
                                                setSelectedReport(null);
                                            }}
                                            className="flex-3 py-4 rounded-2xl font-bold text-xs bg-rose-500 text-white shadow-xl shadow-rose-500/20 hover:brightness-110 transition-all uppercase tracking-widest"
                                        >
                                            Reject & Remove Content
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t border-surface2">
                                        <div className={`p-4 rounded-2xl flex items-center justify-center gap-2 border ${
                                            selectedReport.status === 'ignored' ? 'bg-surface2 border-surface text-muted' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500'
                                        }`}>
                                            <CheckCircle2 size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                Case {selectedReport.status === 'ignored' ? 'Closed (Ignored)' : 'Resolved (Content Removed)'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


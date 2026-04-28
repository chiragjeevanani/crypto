import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Check, Eye, User, Calendar, FileText, ExternalLink, AlertCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredToken } from '../../user/store/useUserStore';

// Assuming admin uses a similar service structure
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const KycManagement = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedKyc, setSelectedKyc] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const token = getStoredToken();
            const res = await fetch(`${API_BASE}/admin/kyc`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setSubmissions(data.submissions);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch KYC submissions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleAction = async (id, status, notes = '') => {
        try {
            setActionLoading(true);
            const token = getStoredToken();
            const res = await fetch(`${API_BASE}/admin/kyc/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ submissionId: id, status, rejectionReason: notes })
            });
            const data = await res.json();
            if (data.success) {
                fetchSubmissions();
                setSelectedKyc(null);
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredSubmissions = submissions.filter(s => 
        s.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.aadharNumber?.includes(searchTerm) ||
        s.panNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'verified': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'rejected': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    if (loading && submissions.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <ShieldCheck className="text-primary" size={32} />
                        KYC Management
                    </h1>
                    <p className="text-sm font-bold text-muted mt-2 uppercase tracking-widest opacity-60">Identity Verification Queue</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name, Aadhar, PAN..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-6 h-14 w-full md:w-[320px] rounded-2xl border bg-surface/50 font-bold text-sm outline-none focus:ring-4 ring-primary/10 focus:border-primary transition-all"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    />
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-3 font-bold text-sm">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Submissions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSubmissions.map((sub) => (
                    <motion.div
                        layoutId={sub._id}
                        key={sub._id}
                        className="rounded-[32px] p-6 border shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        onClick={() => setSelectedKyc(sub)}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-bg flex items-center justify-center overflow-hidden border">
                                {sub.userId?.avatar ? (
                                    <img src={sub.userId.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={24} className="text-muted/30" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black truncate">{sub.userId?.name || 'Unknown User'}</h3>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-tighter truncate">@{sub.userId?.username || 'user'}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(sub.status)}`}>
                                {sub.status}
                            </div>
                        </div>

                        <div className="mt-6 space-y-4 relative z-10">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-muted uppercase">Aadhar</span>
                                <span className="font-black">{sub.aadharNumber}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-muted uppercase">PAN</span>
                                <span className="font-black">{sub.panNumber}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-bold pt-4 border-t border-border/20">
                                <span className="text-muted uppercase tracking-widest flex items-center gap-1">
                                    <Calendar size={12} />
                                    {new Date(sub.createdAt).toLocaleDateString()}
                                </span>
                                <button className="text-primary font-black flex items-center gap-1 hover:gap-2 transition-all">
                                    REVIEW <Eye size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredSubmissions.length === 0 && !loading && (
                <div className="text-center py-20 bg-surface/50 rounded-[40px] border border-dashed border-border/50">
                    <ShieldCheck size={48} className="mx-auto text-muted/20 mb-4" />
                    <h3 className="text-lg font-black text-muted uppercase tracking-widest">No pending requests</h3>
                    <p className="text-xs font-bold text-muted mt-2">All identity verifications are up to date.</p>
                </div>
            )}

            {/* Detailed View Modal */}
            <AnimatePresence>
                {selectedKyc && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-bg/80 backdrop-blur-xl"
                            onClick={() => setSelectedKyc(null)}
                        />
                        <motion.div 
                            layoutId={selectedKyc._id}
                            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] border shadow-2xl bg-surface"
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            <div className="p-8 md:p-12 space-y-12">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-3xl bg-bg flex items-center justify-center border p-1">
                                            {selectedKyc.userId?.avatar ? (
                                                <img src={selectedKyc.userId.avatar} alt="" className="w-full h-full object-cover rounded-[20px]" />
                                            ) : (
                                                <User size={32} className="text-muted/30" />
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black tracking-tight">{selectedKyc.userId?.name}</h2>
                                            <p className="text-sm font-bold text-muted uppercase tracking-[0.2em] mt-1">Verification Details</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedKyc(null)} className="w-12 h-12 rounded-full bg-bg border flex items-center justify-center hover:scale-110 transition-all">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                    {/* Info Panel */}
                                    <div className="space-y-8 lg:col-span-1">
                                        <div className="p-6 rounded-3xl bg-bg/50 border border-border/50 space-y-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Aadhar Number</p>
                                                <p className="text-lg font-black tracking-tighter">{selectedKyc.aadharNumber}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">PAN Number</p>
                                                <p className="text-lg font-black tracking-tighter">{selectedKyc.panNumber}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">User ID</p>
                                                <p className="text-xs font-mono font-bold opacity-60">{selectedKyc.userId?._id}</p>
                                            </div>
                                        </div>

                                        {selectedKyc.status === 'pending' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <button 
                                                    disabled={actionLoading}
                                                    onClick={() => handleAction(selectedKyc._id, 'verified')}
                                                    className="py-4 rounded-2xl bg-emerald-500 text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Check size={16} strokeWidth={3} /> Approve
                                                </button>
                                                <button 
                                                    disabled={actionLoading}
                                                    onClick={() => {
                                                        const notes = prompt('Reason for rejection:');
                                                        if (notes) handleAction(selectedKyc._id, 'rejected', notes);
                                                    }}
                                                    className="py-4 rounded-2xl bg-rose-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <X size={16} strokeWidth={3} /> Reject
                                                </button>
                                            </div>
                                        )}

                                        {selectedKyc.status !== 'pending' && (
                                            <div className={`p-6 rounded-3xl border text-center font-black uppercase tracking-widest text-xs ${getStatusColor(selectedKyc.status)}`}>
                                                Submission {selectedKyc.status}
                                            </div>
                                        )}
                                    </div>

                                    {/* Documents Panel */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted ml-2">Uploaded Documents</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { label: 'Aadhar Front', url: selectedKyc.documents?.aadharFrontUrl },
                                                { label: 'Aadhar Back', url: selectedKyc.documents?.aadharBackUrl },
                                                { label: 'PAN Card', url: selectedKyc.documents?.panCardUrl }
                                            ].map((doc, idx) => (
                                                <div key={idx} className="group relative rounded-3xl border border-border/50 bg-bg/30 overflow-hidden aspect-[4/3]">
                                                    {doc.url ? (
                                                        <>
                                                            <img src={doc.url} alt={doc.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                                <a href={doc.url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-all">
                                                                    <ExternalLink size={20} />
                                                                </a>
                                                            </div>
                                                            <div className="absolute bottom-4 left-4 right-4 py-2 px-4 rounded-xl bg-black/40 backdrop-blur-md text-[9px] font-black text-white uppercase tracking-[0.2em] text-center">
                                                                {doc.label}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-muted/20 gap-2">
                                                            <FileText size={48} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{doc.label} Missing</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default KycManagement;

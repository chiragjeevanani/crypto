import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Filter,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Eye,
    ShieldAlert,
    Clock,
    CheckCircle,
    Activity,
    Plus,
    Trash2,
} from 'lucide-react';
import { AdminPageHeader, AdminStatCard, AdminDataTable } from '../components/shared';
import { useAdminStore } from '../store/useAdminStore';
import { addPostCategory, getPostCategories, removePostCategory } from '../../../shared/postCategories';

export default function ContentControl() {
    const navigate = useNavigate();
    const { posts, loadPosts, handlePostApproval, notify } = useAdminStore();
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [categories, setCategories] = useState(getPostCategories());
    const [newCategory, setNewCategory] = useState('');

    const stats = useMemo(() => {
        const pending = posts.filter(p => String(p.status || '').toLowerCase() === 'pending' || !p.status).length;
        const flagged = posts.filter(p => String(p.status || '').toLowerCase() === 'flagged').length;
        const approved = posts.filter(p => String(p.status || '').toLowerCase() === 'approved').length;
        const rejected = posts.filter(p => String(p.status || '').toLowerCase() === 'rejected').length;
        return { pending, flagged, approved, rejected };
    }, [posts]);

    const filteredPosts = useMemo(() => {
        let result = posts;
        if (statusFilter !== 'all') {
            result = result.filter((post) => {
                const s = String(post.status || '').toLowerCase();
                if (statusFilter === 'pending') return s === 'pending' || s === '';
                return s === statusFilter;
            });
        }
        if (typeFilter === 'promotion') {
            result = result.filter((post) => post.isBusiness || post.promotion?.isEnabled);
        } else if (typeFilter === 'nft') {
            result = result.filter((post) => post.isNFT);
        }
        return result;
    }, [posts, statusFilter, typeFilter]);

    const bulkApprove = async () => {
        const queue = filteredPosts.filter((post) => !['approved', 'rejected'].includes(String(post.status || '').toLowerCase()));
        if (!queue.length) {
            notify('error', 'No pending items available for bulk action.');
            return;
        }
        await Promise.all(queue.map((post) => handlePostApproval(post.id, true)));
        notify('success', `Bulk action completed: ${queue.length} content item(s) approved.`);
    };

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    useEffect(() => {
        const sync = () => setCategories(getPostCategories())
        const onStorage = (event) => {
            if (event.key === 'KnQ Reels_post_categories_v2') sync()
        }
        window.addEventListener('post-categories-updated', sync)
        window.addEventListener('storage', onStorage)
        return () => {
            window.removeEventListener('post-categories-updated', sync)
            window.removeEventListener('storage', onStorage)
        }
    }, [])

    const handleAddCategory = () => {
        const input = newCategory.trim()
        if (!input) {
            notify('error', 'Enter category name first.')
            return
        }
        const next = addPostCategory(input)
        setCategories(next)
        setNewCategory('')
        notify('success', `Category "${input}" created.`)
    }

    const handleRemoveCategory = (name) => {
        const next = removePostCategory(name)
        setCategories(next)
        notify('success', `Category "${name}" removed.`)
    }
    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Content Moderation"
                subtitle="Review and manage community-generated content and trust safety metrics."
                actions={
                    <>
                        <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider text-text">
                            <Filter className="w-3.5 h-3.5" />
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setStatusFilter(next);
                                    notify('success', `Content filter set to ${next.toUpperCase()}.`);
                                }}
                                className="bg-transparent outline-none text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="flagged">Flagged</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider text-text">
                            <Activity className="w-3.5 h-3.5" />
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="bg-transparent outline-none text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
                            >
                                <option value="all">All Types</option>
                                <option value="promotion">Promotions</option>
                                <option value="nft">NFTs</option>
                            </select>
                        </div>
                        <button
                            onClick={bulkApprove}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md"
                        >
                            Bulk Action
                        </button>
                    </>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard 
                    label="Pending Review" 
                    value={stats.pending} 
                    change="+8" 
                    icon={Clock} 
                    color="primary" 
                    onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                />
                <AdminStatCard 
                    label="Flagged Today" 
                    value={stats.flagged} 
                    change="High Risk" 
                    icon={ShieldAlert} 
                    color="rose-500" 
                    onClick={() => setStatusFilter(statusFilter === 'flagged' ? 'all' : 'flagged')}
                />
                <AdminStatCard 
                    label="Rejected/Removed" 
                    value={stats.rejected} 
                    change="+12" 
                    icon={XCircle} 
                    color="emerald-500" 
                    onClick={() => setStatusFilter(statusFilter === 'rejected' ? 'all' : 'rejected')}
                />
                <AdminStatCard 
                    label="Approved Content" 
                    value={stats.approved} 
                    change="-2m" 
                    icon={CheckCircle} 
                    color="indigo-500" 
                    onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
                />
            </div>

            <div className="bg-surface border border-surface rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text">Post Categories</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Create category (e.g. Music)"
                            className="px-3 py-1.5 rounded-lg text-xs bg-bg border border-surface outline-none text-text"
                        />
                        <button onClick={handleAddCategory} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary text-black">
                            <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <div key={cat} className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg border border-surface">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-text">{cat}</span>
                            <button onClick={() => handleRemoveCategory(cat)} className="text-rose-500">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <AdminDataTable
                title="Quarantined Content Ledger"
                columns={["Content", "Author", "Reason", "Status", "Actions"]}
                data={filteredPosts.map(post => ({
                    id: post.id,
                    cells: [
                        <div className="flex items-center gap-3">
                            <div
                                onClick={() => navigate(`/admin/content/${post.id}`)}
                                className="w-10 h-10 rounded-lg bg-surface2 overflow-hidden border border-surface cursor-pointer relative"
                            >
                                {['video', 'reel'].includes(post.mediaType?.toLowerCase()) || (post.thumbnail || '').match(/\.(mp4|m4v|mov|webm)$/i) ? (
                                    <video 
                                        src={post.thumbnail} 
                                        className="w-full h-full object-cover" 
                                        muted 
                                        onMouseOver={e => e.target.play()} 
                                        onMouseOut={e => { e.target.pause(); e.target.currentTime = 0; }}
                                    />
                                ) : (
                                    <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div>
                                <p
                                    onClick={() => navigate(`/admin/content/${post.id}`)}
                                    className="text-xs font-semibold text-text cursor-pointer hover:text-primary transition-colors"
                                >
                                    {post.id}
                                </p>
                                <p className="text-[10px] text-muted truncate max-w-[200px] font-medium mb-1">{post.content}</p>
                                {post.isBusiness && (
                                    <div className="flex flex-col gap-1.5 mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[8px] font-bold uppercase tracking-wider border border-blue-500/20">
                                                Promotion
                                            </span>
                                            <span className={`text-[10px] font-bold ${
                                                post.paymentStatus === 'paid' ? 'text-emerald-500' :
                                                post.paymentStatus === 'failed' ? 'text-rose-500' :
                                                'text-amber-500'
                                            }`}>
                                                ₹{post.promotion?.totalBudget || 0}
                                            </span>
                                        </div>
                                        {/* Payment Status Badge */}
                                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border w-fit ${
                                            post.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            post.paymentStatus === 'failed' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }`}>
                                            {post.paymentStatus === 'paid' ? <CheckCircle className="w-2.5 h-2.5" /> : 
                                             post.paymentStatus === 'failed' ? <XCircle className="w-2.5 h-2.5" /> : 
                                             <Clock className="w-2.5 h-2.5" />}
                                            {post.paymentStatus === 'paid' ? 'Paid' : post.paymentStatus === 'failed' ? 'Payment Failed' : 'Pending Payment'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>,
                        <span className="text-xs font-medium text-text">@{post.author}</span>,
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-500">
                            <AlertTriangle className="w-3 h-3" />
                            {post.flagReason}
                        </div>,
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-wider border ${post.status === 'Urgent' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                post.status === 'Flagged' ? 'bg-primary/10 text-primary border-primary/20' :
                                    post.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                        'bg-surface2 text-muted border-surface'
                            }`}>
                            {post.status}
                        </span>,
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => navigate(`/admin/content/${post.id}`)}
                                className="p-1.5 rounded-md bg-surface2 hover:bg-surface border border-surface transition-all"
                            >
                                <Eye className="w-3.5 h-3.5 text-muted hover:text-primary transition-colors" />
                            </button>
                            {post.status !== 'Approved' && (
                                <button
                                    disabled={post.isBusiness && post.paymentStatus !== 'paid'}
                                    onClick={() => handlePostApproval(post.id, true)}
                                    className={`p-1.5 rounded-md border transition-all ${
                                        post.isBusiness && post.paymentStatus !== 'paid' 
                                            ? 'bg-muted/5 border-muted/10 opacity-30 cursor-not-allowed' 
                                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20'
                                    }`}
                                >
                                    <CheckCircle2 className={`w-3.5 h-3.5 ${post.isBusiness && post.paymentStatus !== 'paid' ? 'text-muted' : 'text-emerald-500'}`} />
                                </button>
                            )}
                            <button
                                onClick={() => handlePostApproval(post.id, false)}
                                className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                            >
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            </button>
                        </div>
                    ]
                }))}
            />
        </div>
    );
}

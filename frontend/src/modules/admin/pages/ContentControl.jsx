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
    const [categories, setCategories] = useState(getPostCategories());
    const [newCategory, setNewCategory] = useState('');

    const filteredPosts = useMemo(() => {
        if (statusFilter === 'all') return posts;
        return posts.filter((post) => String(post.status || '').toLowerCase() === statusFilter);
    }, [posts, statusFilter]);

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
            if (event.key === 'socialearn_post_categories_v2') sync()
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
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="flagged">Flagged</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
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
                <AdminStatCard label="Pending Review" value="124" change="+8" icon={Clock} color="primary" />
                <AdminStatCard label="Flagged Today" value="18" change="High Risk" icon={ShieldAlert} color="rose-500" />
                <AdminStatCard label="Auto-Removed" value="452" change="+12" icon={CheckCircle} color="emerald-500" />
                <AdminStatCard label="Avg Wait Time" value="12m" change="-2m" icon={Activity} color="indigo-500" />
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
                                className="w-10 h-10 rounded-lg bg-surface2 overflow-hidden border border-surface cursor-pointer"
                            >
                                <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p
                                    onClick={() => navigate(`/admin/content/${post.id}`)}
                                    className="text-xs font-semibold text-text cursor-pointer hover:text-primary transition-colors"
                                >
                                    {post.id}
                                </p>
                                <p className="text-[10px] text-muted truncate max-w-[200px] font-medium">{post.content}</p>
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
                                    onClick={() => handlePostApproval(post.id, true)}
                                    className="p-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
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

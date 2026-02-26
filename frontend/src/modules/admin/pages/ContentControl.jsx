import React from 'react';
import { motion } from 'framer-motion';
import {
    Filter,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Eye,
    ShieldAlert,
    Clock,
    CheckCircle,
    Activity
} from 'lucide-react';
import { AdminPageHeader, AdminStatCard, AdminDataTable } from '../components/shared';

const mockPosts = [
    {
        id: 'POST-4821',
        author: 'cryptoking_99',
        type: 'Video',
        content: 'Check out this new NFT drop! Fast money...',
        flagReason: 'Potential Scam Mention',
        status: 'Pending',
        thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4628c6bb5?w=200&h=200&fit=crop'
    },
    {
        id: 'POST-4822',
        author: 'art_lover_22',
        type: 'Image',
        content: 'My latest digital painting for the community.',
        flagReason: 'Copyright Check - Visual match',
        status: 'Flagged',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop'
    },
    {
        id: 'POST-4823',
        author: 'meme_lord',
        type: 'Post',
        content: 'Click here for free tokens! 🔥🔥🔥',
        flagReason: 'Spam Pattern Detected',
        status: 'Urgent',
        thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=200&h=200&fit=crop'
    }
];

export default function ContentControl() {
    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Content Moderation"
                subtitle="Review and manage community-generated content and trust safety metrics."
                actions={
                    <>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text">
                            <Filter className="w-3.5 h-3.5" />
                            Filter
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md">
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

            <AdminDataTable
                title="Quarantined Content Ledger"
                columns={["Content", "Author", "Reason", "Status", "Actions"]}
                data={mockPosts.map(post => ({
                    id: post.id,
                    cells: [
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-surface2 overflow-hidden border border-surface">
                                <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-text">{post.id}</p>
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
                                    'bg-surface2 text-muted border-surface'
                            }`}>
                            {post.status}
                        </span>,
                        <div className="flex items-center gap-1.5">
                            <button className="p-1.5 rounded-md bg-surface2 hover:bg-surface border border-surface transition-all">
                                <Eye className="w-3.5 h-3.5 text-muted hover:text-primary transition-colors" />
                            </button>
                            <button className="p-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            </button>
                            <button className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all">
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            </button>
                        </div>
                    ]
                }))}
            />
        </div>
    );
}

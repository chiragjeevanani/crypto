import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Shield, Clock, User } from 'lucide-react';
import { AdminPageHeader } from '../components/shared';
import { useAdminStore } from '../store/useAdminStore';

export default function ContentDetailPage() {
    const navigate = useNavigate();
    const { postId } = useParams();
    const { postDetail, loadPostDetail, handlePostApproval, isLoading } = useAdminStore();

    useEffect(() => {
        if (postId) loadPostDetail(postId);
    }, [postId, loadPostDetail]);

    if (!postDetail && !isLoading) {
        return (
            <div className="space-y-6">
                <AdminPageHeader
                    title="Post Not Found"
                    subtitle="This content item does not exist in moderation queue."
                    actions={
                        <button
                            onClick={() => navigate('/admin/content')}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider text-text"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Content
                        </button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <AdminPageHeader
                title={`Content Review: ${postDetail?.id || postId}`}
                subtitle="Review full post context, risk reports, and creator profile before moderation decision."
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/admin/content')}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider text-text"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back
                        </button>
                        <button
                            onClick={() => handlePostApproval(postDetail.id, true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-[10px] font-semibold uppercase tracking-wider text-emerald-500"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                        </button>
                        <button
                            onClick={() => handlePostApproval(postDetail.id, false)}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-500/15 border border-rose-500/30 rounded-lg text-[10px] font-semibold uppercase tracking-wider text-rose-500"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-surface border border-surface rounded-2xl overflow-hidden">
                    <img src={postDetail?.mediaUrl || postDetail?.thumbnail} alt={postDetail?.id} className="w-full h-[360px] object-cover" />
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-text">{postDetail?.type}</p>
                            <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                {postDetail?.status}
                            </span>
                        </div>
                        <p className="text-sm text-text leading-relaxed">{postDetail?.content}</p>
                        <div className="p-3 rounded-xl bg-bg border border-surface">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Moderation Notes</p>
                            <p className="text-xs text-text">{postDetail?.moderationNotes}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-surface border border-surface rounded-2xl p-4 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text">Risk Summary</p>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Reports</span>
                            <span className="text-text font-semibold">{postDetail?.reportCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> AI Risk</span>
                            <span className="text-rose-500 font-semibold">{postDetail?.aiRiskScore}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Submitted</span>
                            <span className="text-text font-semibold">{new Date(postDetail?.createdAt || Date.now()).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="bg-surface border border-surface rounded-2xl p-4 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text">Creator Context</p>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted flex items-center gap-1"><User className="w-3.5 h-3.5" /> Author</span>
                            <span className="text-text font-semibold">@{postDetail?.author}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted">Followers</span>
                            <span className="text-text font-semibold">{postDetail?.authorStats?.followers || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted">Previous Flags</span>
                            <span className="text-text font-semibold">{postDetail?.authorStats?.previousFlags || 0}</span>
                        </div>
                    </div>

                    <div className="bg-surface border border-surface rounded-2xl p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text mb-3">Report Breakdown</p>
                        <div className="space-y-2">
                            {(postDetail?.reports || []).map((report) => (
                                <div key={report.id} className="p-2 rounded-lg bg-bg border border-surface">
                                    <p className="text-[10px] text-text font-semibold">{report.reason}</p>
                                    <p className="text-[9px] text-muted uppercase tracking-wider mt-1">{report.source} · {report.confidence}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


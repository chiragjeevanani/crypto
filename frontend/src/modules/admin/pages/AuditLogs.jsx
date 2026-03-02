import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminStore } from '../store/useAdminStore';
import {
    Database,
    ExternalLink,
    Lock,
    Eye,
    RefreshCw,
    Search,
    FileSearch,
    CheckCircle,
    Clock,
    ShieldCheck
} from 'lucide-react';
import { AdminPageHeader, AdminStatCard, AdminDataTable } from '../components/shared';

const logs = [
    { id: 'LOG-4501', event: 'Campaign Reward Payout', actor: 'System Auto-Processor', target: '480 Recipients', status: 'Success', hash: '0x8f23...a491', timestamp: '10 mins ago' },
    { id: 'LOG-4502', event: 'New NFT Verification', actor: 'Admin_Sarah', target: 'NFT-901 (CyberPunk)', status: 'Verified', hash: '0x12a9...d032', timestamp: '24 mins ago' },
    { id: 'LOG-4503', event: 'Suspicious Account Flag', actor: 'Fraud Engine AI', target: 'User_9921 (U-882)', status: 'Caution', hash: '0x991b...c110', timestamp: '1 hour ago' },
    { id: 'LOG-4504', event: 'Global Config Change', actor: 'SuperAdmin', target: 'Withdrawal Limit', status: 'Updated', hash: '0x55c1...e923', timestamp: '2 hours ago' },
];

export default function AuditLogs() {
    const { auditLogs, campaignClosures, loadAuditLogs, loadCampaigns, linkCampaignClosureAudit, isLoading } = useAdminStore();

    useEffect(() => {
        loadAuditLogs();
        loadCampaigns();
    }, [loadAuditLogs, loadCampaigns]);

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Public Transparency"
                subtitle="On-chain and system-wide audit logs for platform integrity."
                actions={
                    <button
                        onClick={() => loadAuditLogs()}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Sync Explorer
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard label="Blockchain" value="Healthy" icon={CheckCircle} color="emerald-500" />
                <AdminStatCard label="Unverified" value="0" icon={Lock} color="primary" />
                <AdminStatCard label="Live Events" value="1,240/hr" icon={Clock} color="indigo-500" />
                <AdminStatCard label="Records" value={auditLogs.length.toLocaleString()} icon={Database} color="muted" />
            </div>

            <AdminDataTable
                title="System Operations Audit"
                columns={["Timestamp", "Event Detail", "Actor", "Status", "Hash", "Actions"]}
                data={auditLogs.map(log => ({
                    id: log.id,
                    cells: [
                        <span className="text-[10px] text-muted font-medium uppercase tracking-tight">{log.timestamp}</span>,
                        <div>
                            <p className="text-xs font-semibold text-text">{log.event}</p>
                            <p className="text-[9px] text-muted font-medium uppercase tracking-tight">Target: {log.target}</p>
                        </div>,
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-bg border border-surface text-text rounded-md">{log.actor}</span>,
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest border ${log.status === 'Success' || log.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            log.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                'bg-primary/10 text-primary border-primary/20'
                            }`}>
                            {log.status}
                        </span>,
                        <span className="font-mono text-[10px] text-muted">{log.hash}</span>,
                        <button className="p-1.5 bg-surface2 hover:bg-surface rounded-md transition-all border border-surface group">
                            <ExternalLink className="w-3 h-3 text-muted group-hover:text-primary" />
                        </button>
                    ]
                }))}
            />

            <div className="bg-surface border border-surface rounded-lg p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-text mb-4">Campaign Closure to Immutable Audit Links</h3>
                <div className="space-y-2">
                    {campaignClosures.length === 0 && (
                        <div className="p-3 rounded-lg bg-bg border border-surface text-[9px] text-muted uppercase tracking-wider">
                            No campaign closures available.
                        </div>
                    )}
                    {campaignClosures.map((closure) => (
                        <div key={closure.id} className="p-3 rounded-lg bg-bg border border-surface flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-text">{closure.title}</p>
                                <p className="text-[9px] text-muted uppercase tracking-wider">Winner: {closure.winner} · Payout: {closure.payout}</p>
                            </div>
                            <button
                                onClick={() => linkCampaignClosureAudit(closure.id)}
                                disabled={closure.auditLinked}
                                className={`px-2.5 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider border ${closure.auditLinked ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}
                            >
                                {closure.auditLinked ? 'Linked' : 'Link'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-surface/50 border border-dashed border-surface rounded-lg p-8 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-surface rounded-full mb-4 border border-surface">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-sm font-semibold mb-2 text-text">Immutable Protocol Active</h4>
                <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
                    All operations within this ledger are cryptographically sealed and synchronized with the decentralized node network for public verification.
                </p>
            </div>
        </div>
    );
}

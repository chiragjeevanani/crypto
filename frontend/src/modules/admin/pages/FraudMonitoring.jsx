import React from 'react';
import { motion } from 'framer-motion';
import {
    ShieldAlert,
    MapPin,
    Smartphone,
    Activity,
    AlertTriangle,
    Ban,
    UserX,
    RefreshCw,
    Zap,
    Filter,
    ArrowRight
} from 'lucide-react';
import { AdminPageHeader, AdminStatCard, AdminDataTable } from '../components/shared';

const suspiciousLogs = [
    { id: 'FR-901', user: 'BotMaster_22', reason: 'Abnormal Voting Speed', risk: 'High', location: 'Frankfurt, GE', device: 'Node.js Bot', time: '1m ago' },
    { id: 'FR-902', user: 'Farmer_Joe', reason: 'IP Match: 12 Accounts', risk: 'Critical', location: 'Dhaka, BD', device: 'Chrome / Win10', time: '5m ago' },
    { id: 'FR-903', user: 'Silent_Runner', reason: 'Large Tx: New Account', risk: 'Medium', location: 'New York, US', device: 'Safari / iPhone 15', time: '12m ago' },
    { id: 'FR-904', user: 'GiftGiver_001', reason: 'Reciprocal Gifting Loop', risk: 'Medium', location: 'Moscow, RU', device: 'Chrome / Linux', time: '22m ago' },
];

export default function FraudMonitoring() {
    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Security Intelligence"
                subtitle="Neural-linked fraud detection and real-time prevention protocols."
                actions={
                    <>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Recalibrate AI
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md hover:bg-rose-600 transition-all">
                            <UserX className="w-3.5 h-3.5" />
                            Lockdown
                        </button>
                    </>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard label="High Risk Users" value="42" change="+5" icon={AlertTriangle} color="rose-500" />
                <AdminStatCard label="IP Clusters" value="12" change="-2" icon={MapPin} color="amber-500" />
                <AdminStatCard label="Bot Signals" value="1,240" change="+12%" icon={Zap} color="primary" />
                <AdminStatCard label="Neural Resolution" value="98.2%" change="+0.4%" icon={Activity} color="emerald-500" />
            </div>

            <AdminDataTable
                title="Anomaly Detection Stream"
                columns={["Actor", "Detail", "Risk", "Context", "Actions"]}
                data={suspiciousLogs.map(log => ({
                    id: log.id,
                    cells: [
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-bg border border-surface flex items-center justify-center text-[10px] font-semibold text-text">
                                {log.user[0]}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-text">@{log.user}</p>
                                <p className="text-[9px] text-muted font-medium uppercase tracking-wider">{log.id}</p>
                            </div>
                        </div>,
                        <div>
                            <p className="text-xs font-medium text-rose-500">{log.reason}</p>
                            <p className="text-[9px] text-muted font-medium uppercase tracking-wider">Triggered {log.time}</p>
                        </div>,
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-semibold uppercase tracking-wider border ${log.risk === 'Critical' || log.risk === 'High'
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                            {log.risk}
                        </span>,
                        <div className="flex flex-col gap-0.5 text-[9px] text-muted font-medium uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><MapPin className="w-2.5 h-2.5" /> {log.location}</span>
                            <span className="flex items-center gap-1.5"><Smartphone className="w-2.5 h-2.5" /> {log.device}</span>
                        </div>,
                        <div className="flex items-center gap-1.5">
                            <button className="px-3 py-1.5 bg-surface2 hover:bg-surface border border-surface rounded-md text-[9px] font-semibold uppercase tracking-wider text-text transition-all">Details</button>
                            <button className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-md text-rose-500 transition-all">
                                <Ban className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ]
                }))}
            />

            <div className="flex items-center justify-center py-6">
                <button className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted hover:text-primary transition-all group">
                    View Forensic Analysis Report <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}

import { useAdminStore } from '../store/useAdminStore';
import { useEffect, useState } from 'react';
import {
    RefreshCw,
    UserX,
    AlertTriangle,
    MapPin,
    Zap,
    Activity,
    Smartphone,
    Ban,
    ArrowRight
} from 'lucide-react';
import { AdminPageHeader, AdminStatCard, AdminDataTable } from '../components/shared';

export default function FraudMonitoring() {
    const { suspiciousUsers, loadSuspiciousUsers, toggleUserBan, isLoading } = useAdminStore();
    const [recalibrating, setRecalibrating] = useState(false);

    useEffect(() => {
        loadSuspiciousUsers();
    }, [loadSuspiciousUsers]);

    const handleRecalibrate = async () => {
        setRecalibrating(true);
        // Simulate heavy AI processing
        await new Promise(r => setTimeout(r, 2000));
        await loadSuspiciousUsers();
        setRecalibrating(false);
    };

    const handleBan = (id) => {
        if (window.confirm('Broadcast permanent lockout to node network? This action is recorded in the immutable audit trail.')) {
            toggleUserBan(id);
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Security Intelligence"
                subtitle="Neural-linked fraud detection and real-time prevention protocols."
                actions={
                    <>
                        <button
                            onClick={handleRecalibrate}
                            disabled={recalibrating}
                            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${recalibrating ? 'animate-spin' : ''}`} />
                            {recalibrating ? 'Processing Neural Path...' : 'Recalibrate AI'}
                        </button>
                        <button
                            onClick={() => alert('LOCKDOWN PROTOCOL INITIATED: Restricting all non-essential ingress.')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md hover:bg-rose-600 transition-all font-bold"
                        >
                            <UserX className="w-3.5 h-3.5" />
                            Lockdown
                        </button>
                    </>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard label="High Risk Users" value={suspiciousUsers.length.toString()} change="+5" icon={AlertTriangle} color="rose-500" />
                <AdminStatCard label="IP Clusters" value="12" change="-2" icon={MapPin} color="amber-500" />
                <AdminStatCard label="Bot Signals" value="1,240" change="+12%" icon={Zap} color="primary" />
                <AdminStatCard label="Neural Resolution" value="98.2%" change="+0.4%" icon={Activity} color="emerald-500" />
            </div>

            <AdminDataTable
                title="Anomaly Detection Stream"
                columns={["Actor", "Detail", "Risk", "Context", "Actions"]}
                data={suspiciousUsers.map(user => ({
                    id: user.id,
                    cells: [
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-bg border border-surface flex items-center justify-center text-[10px] font-semibold text-text">
                                {user.name[0]}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-text">@{user.name}</p>
                                <p className="text-[9px] text-muted font-medium uppercase tracking-wider">{user.id}</p>
                            </div>
                        </div>,
                        <div>
                            <p className="text-xs font-medium text-rose-500">{user.id === '3' ? 'Financial Receipt Discrepancy' : 'Manual Flag / Heuristic Trigger'}</p>
                            <p className="text-[9px] text-muted font-medium uppercase tracking-wider">{user.id === '3' ? 'Anomaly: Fake Verification doc' : 'Detection: High Correlation'}</p>
                        </div>,
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-semibold uppercase tracking-wider border ${user.riskScore === 'High'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                            {user.riskScore}
                        </span>,
                        <div className="flex flex-col gap-0.5 text-[9px] text-muted font-medium uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><MapPin className="w-2.5 h-2.5" /> {user.id === '3' ? 'Node-ID Match Error' : 'Global (Multi-IP)'}</span>
                            <span className="flex items-center gap-1.5"><Smartphone className="w-2.5 h-2.5" /> Web Interface</span>
                        </div>,
                        <div className="flex items-center gap-1.5">
                            <button className="px-3 py-1.5 bg-surface2 hover:bg-surface border border-surface rounded-md text-[9px] font-semibold uppercase tracking-wider text-text transition-all">Forensics</button>
                            <button
                                onClick={() => handleBan(user.id)}
                                className={`p-1.5 rounded-md transition-all border ${user.isBanned ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                                    }`}
                                title={user.isBanned ? "Unban" : "Ban"}
                            >
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

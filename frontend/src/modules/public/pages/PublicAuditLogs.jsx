import React from 'react';
import { AdminDataTable } from '../../admin/components/shared';
import { useCampaignStore } from '../../user/store/useCampaignStore';

export default function PublicAuditLogs() {
    const sample = useCampaignStore((state) => state.auditLogs);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-semibold">Audit Logs</h2>
            <AdminDataTable
                title="Public Ledger"
                columns={["Timestamp", "Event Detail", "Actor", "Status", "Hash"]}
                data={sample.map(s => ({ id: s.id, cells: [<span className="text-[10px] text-muted">{s.timestamp}</span>, <div><p className="text-xs font-semibold">{s.event}</p><p className="text-[9px] text-muted">{s.actor}</p></div>, <span className="text-[10px] font-semibold">{s.actor}</span>, <span className="font-mono text-[10px]">{s.status}</span>, <span className="font-mono text-[10px]">{s.hash}</span>] }))}
            />
        </div>
    );
}

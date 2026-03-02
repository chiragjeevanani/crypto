import React from 'react';
import { useCampaignStore } from '../../user/store/useCampaignStore';

export default function VotingStats() {
    const campaigns = useCampaignStore((state) => state.campaigns);
    const totalVotes = campaigns.reduce(
        (sum, campaign) => sum + campaign.submissions.reduce((s, entry) => s + entry.votes, 0),
        0,
    );
    const totalEntries = campaigns.reduce((sum, campaign) => sum + campaign.submissions.length, 0);
    const avgVotes = totalEntries ? Math.round(totalVotes / totalEntries) : 0;
    const completedPct = campaigns.length
        ? Math.round((campaigns.filter((campaign) => campaign.votingStatus === 'completed').length / campaigns.length) * 100)
        : 0;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-semibold">Voting Statistics</h2>
            <p className="text-[10px] text-muted">Live voting telemetry from campaign submissions.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 bg-bg border border-surface rounded-lg">
                    <p className="text-[9px] uppercase font-bold text-muted">Total Votes</p>
                    <p className="text-2xl font-bold">{totalVotes.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-bg border border-surface rounded-lg">
                    <p className="text-[9px] uppercase font-bold text-muted">Completion / Live Split</p>
                    <div className="mt-2 flex gap-2">
                        <div className="flex-1 bg-emerald-500 h-2 rounded" style={{ width: `${completedPct}%` }} />
                        <div className="flex-1 bg-rose-500 h-2 rounded" style={{ width: `${100 - completedPct}%` }} />
                    </div>
                    <p className="text-[10px] mt-2 text-muted">Avg votes per submission: {avgVotes}</p>
                </div>
            </div>
        </div>
    );
}

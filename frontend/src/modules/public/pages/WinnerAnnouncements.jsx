import React from 'react';
import { useCampaignStore } from '../../user/store/useCampaignStore';

export default function WinnerAnnouncements() {
    const winners = useCampaignStore((state) =>
        state.campaigns.filter((campaign) => campaign.votingStatus === 'completed' && campaign.winner),
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-semibold">Recent Winner Announcements</h2>
            <p className="text-[10px] text-muted">
                Verified winners from completed campaigns and public voting rounds.
            </p>
            <ul className="space-y-4">
                {winners.length === 0 && (
                    <li className="p-4 bg-bg border border-surface rounded-lg">
                        <p className="text-sm font-bold">No completed campaigns yet</p>
                    </li>
                )}
                {winners.map((campaign) => (
                    <li key={campaign.id} className="p-4 bg-bg border border-surface rounded-lg">
                        <p className="text-sm font-bold">{campaign.title}</p>
                        <p className="text-[9px] text-muted">Winner: {campaign.winner.creatorHandle}</p>
                        <p className="text-[9px] text-muted">Prize: ₹{campaign.myReward}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

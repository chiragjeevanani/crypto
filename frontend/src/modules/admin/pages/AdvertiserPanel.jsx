import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPageHeader } from '../components/shared';

export default function AdvertiserPanel() {
    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="Advertiser Self‑Service"
                subtitle="(Phase 2) Brands and agencies will be able to manage campaigns directly."
            />

            <div className="space-y-10">
                <p className="text-[10px] text-muted">
                    Admins are still handling campaigns manually for now; below is a polished static preview of the
                    brand/agency dashboard. Once backend APIs are ready these widgets will become fully interactive.
                </p>

                {/* stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Campaigns', value: 24 },
                        { label: 'Active', value: 8 },
                        { label: 'Drafts', value: 5 },
                        { label: 'Budget Spent', value: '$142,300' }
                    ].map(stat => (
                        <div
                            key={stat.label}
                            className="p-4 bg-bg border border-surface rounded-lg text-center cursor-pointer hover:bg-surface2 transition"
                            onClick={() => navigate('/admin/campaigns')}
                        >
                            <p className="text-[9px] uppercase font-bold text-muted">{stat.label}</p>
                            <p className="text-xl font-semibold text-text mt-1">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* action buttons */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => navigate('/admin/campaigns/new')}
                        className="px-5 py-2 bg-primary text-black rounded-lg text-[10px] font-bold uppercase tracking-wider shadow hover:bg-primary/90 transition"
                    >
                        Create Campaign
                    </button>
                    <button
                        onClick={() => navigate('/admin/campaigns')}
                        className="px-5 py-2 bg-surface border border-surface rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-surface2 transition"
                    >
                        My Campaigns
                    </button>
                    <button
                        onClick={() => navigate('/admin/campaigns')}
                        className="px-5 py-2 bg-surface border border-surface rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-surface2 transition"
                    >
                        Upload Creatives
                    </button>
                </div>

                {/* campaign cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { title: 'Summer Blast 2026', brand: 'CoolDrinks Inc.', budget: '$25k', status: 'Live' },
                        { title: 'New App Launch', brand: 'FunGames LLC', budget: '$7.5k', status: 'Draft' },
                        { title: 'Holiday Promo', brand: 'TravelX', budget: '$12k', status: 'Paused' }
                    ].map(c => (
                        <div key={c.title} className="p-6 bg-bg border border-surface rounded-lg space-y-2">
                            <h3 className="text-base font-bold text-text">{c.title}</h3>
                            <p className="text-[9px] text-muted">Brand: {c.brand}</p>
                            <p className="text-[9px] text-muted">Budget: {c.budget}</p>
                            <p className={`text-[9px] font-bold uppercase ${
                                c.status === 'Live' ? 'text-emerald-500' : c.status === 'Draft' ? 'text-amber-500' : 'text-rose-500'
                            }`}>{c.status}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
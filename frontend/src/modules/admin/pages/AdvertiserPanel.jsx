import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Megaphone,
    Settings,
    Plus,
    TrendingUp,
    Target,
    CreditCard,
    Users,
    BarChart3,
    ArrowUpRight
} from 'lucide-react';
import { AdminPageHeader } from '../components/shared';

export default function AdvertiserPanel() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');

    const stats = [
        { label: 'Total Campaigns', value: 24, icon: Megaphone, trend: '+3 this month' },
        { label: 'Active Reach', value: '1.2M', icon: Users, trend: '↑ 12%' },
        { label: 'Conversion Rate', value: '3.8%', icon: Target, trend: '↑ 0.5%' },
        { label: 'Total Budget', value: '₹1,42,300', icon: CreditCard, trend: 'Utilized: 68%' }
    ];

    const currentCampaigns = [
        { title: 'Summer Blast 2026', brand: 'CoolDrinks Inc.', budget: '₹25,000', status: 'Live', progress: 65 },
        { title: 'New App Launch', brand: 'FunGames LLC', budget: '₹7,500', status: 'Draft', progress: 0 },
        { title: 'Holiday Promo', brand: 'TravelX', budget: '₹12,000', status: 'Paused', progress: 40 }
    ];

    return (
        <div className="space-y-8 pb-20">
            <AdminPageHeader
                title="Advertiser Portal"
                subtitle="Brands and agencies workspace for campaign lifecycle management and analytics."
                actions={
                    <button
                        onClick={() => navigate('/admin/campaigns/new')}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Create Campaign
                    </button>
                }
            />

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-surface border border-surface rounded-2xl w-fit">
                {[
                    { id: 'Overview', icon: LayoutDashboard },
                    { id: 'Campaigns', icon: Megaphone },
                    { id: 'Analytics', icon: BarChart3 },
                    { id: 'Settings', icon: Settings }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === tab.id
                                ? 'bg-bg text-primary shadow-sm'
                                : 'text-muted hover:text-text hover:bg-surface2'
                            }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.id}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'Overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="p-6 bg-surface border border-surface rounded-2xl hover:border-primary/30 transition-all group cursor-pointer"
                                    onClick={() => navigate('/admin/campaigns')}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 bg-bg rounded-xl border border-surface group-hover:text-primary transition-colors">
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                    <p className="text-[10px] uppercase font-bold text-muted tracking-widest">{stat.label}</p>
                                    <h4 className="text-2xl font-bold text-text mt-1">{stat.value}</h4>
                                    <p className="text-[9px] font-medium text-emerald-500 mt-2 uppercase tracking-tight">{stat.trend}</p>
                                </div>
                            ))}
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main List */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text">Recent Campaigns</h3>
                                    <button
                                        onClick={() => navigate('/admin/campaigns')}
                                        className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline"
                                    >
                                        View All
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {currentCampaigns.map((camp) => (
                                        <div
                                            key={camp.title}
                                            className="p-5 bg-surface border border-surface rounded-2xl hover:bg-surface2 transition-all cursor-pointer group"
                                            onClick={() => navigate('/admin/campaigns')}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h4 className="text-sm font-bold text-text group-hover:text-primary transition-colors">{camp.title}</h4>
                                                    <p className="text-[10px] text-muted font-medium mt-0.5">{camp.brand}</p>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider border ${camp.status === 'Live' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        camp.status === 'Draft' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                            'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                    }`}>
                                                    {camp.status}
                                                </span>
                                            </div>
                                            <div className="pt-2">
                                                <div className="flex justify-between items-center text-[9px] font-bold text-muted uppercase mb-1.5">
                                                    <span>Budget: {camp.budget}</span>
                                                    <span>{camp.progress}% Used</span>
                                                </div>
                                                <div className="h-1 bg-bg rounded-full overflow-hidden border border-surface/50">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${camp.progress}%` }}
                                                        className={`h-full rounded-full ${camp.status === 'Live' ? 'bg-primary' : 'bg-surface2'}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sidebar Info */}
                            <div className="space-y-6">
                                <div className="p-6 bg-bg border border-dashed border-surface rounded-2xl text-center">
                                    <div className="w-12 h-12 bg-surface2 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-surface">
                                        <Plus className="w-6 h-6 text-muted" />
                                    </div>
                                    <h4 className="text-sm font-bold text-text mb-2">New Brand?</h4>
                                    <p className="text-[10px] text-muted leading-relaxed uppercase tracking-wider mb-5 px-4">
                                        Onboard your clinical agency to start launching targeted reward protocols.
                                    </p>
                                    <button
                                        onClick={() => navigate('/admin/campaigns/new')}
                                        className="w-full py-3 bg-surface border border-surface rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-surface2 transition-all"
                                    >
                                        Start Onboarding
                                    </button>
                                </div>

                                <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Growth Tip</h4>
                                    </div>
                                    <p className="text-[10px] text-text font-medium leading-relaxed uppercase italic">
                                        "Campaigns with clear reward micro-interactions see 40% higher retention on the decentralized feed."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab !== 'Overview' && (
                    <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-64 border border-dashed border-surface rounded-3xl flex flex-col items-center justify-center text-center p-8"
                    >
                        <Megaphone className="w-10 h-10 text-muted/20 mb-4" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{activeTab} Interface Locked</h3>
                        <p className="text-[9px] text-muted/60 mt-2 uppercase tracking-widest max-w-[280px]">
                            Advanced {activeTab.toLowerCase()} protocols are currently being deployed to secondary clusters.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
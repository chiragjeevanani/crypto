import React, { useState, useEffect } from 'react';
import {
    Users,
    TrendingUp,
    Gift,
    Clock,
    DollarSign,
    Target,
    Activity,
    ShieldCheck,
    BarChart3,
    ArrowUpRight,
    ChevronRight,
    AlertCircle,
    Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminPageHeader, AdminStatCard } from '../components/shared';
import { formatCurrency, getCurrency } from '../utils/currency';
import { useAdminStore } from '../store/useAdminStore';

const summaryStats = [
    {
        label: 'Platform Revenue',
        value: formatCurrency(124502.80),
        change: '+12.5%',
        icon: DollarSign,
        color: 'emerald-500',
        path: '/admin/financials'
    },
    {
        label: 'Active Creators',
        value: '42,842',
        change: '+3.2%',
        icon: Users,
        color: 'blue-500',
        path: '/admin/users'
    },
    {
        label: 'Brand Mandates',
        value: '124',
        change: '+8',
        icon: Target,
        color: 'primary',
        path: '/admin/campaigns'
    },
    {
        label: 'Micro-Gifts Flux',
        value: '12.4k',
        change: '+5.4k',
        icon: Gift,
        color: 'purple-500',
        path: '/admin/gifts'
    },
    {
        label: 'Payout Latency',
        value: '1.2h',
        change: '-15m',
        icon: Clock,
        color: 'amber-500',
        path: '/admin/withdrawals'
    },
];

const ChartBar = ({ height, value }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div
            className="flex flex-col items-center gap-2 group relative flex-1 h-full justify-end max-w-[30px] min-w-[12px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-text text-bg text-[10px] font-bold rounded-md shadow-2xl whitespace-nowrap z-20 border border-surface/10"
                    >
                        {value}
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="w-full relative flex items-end justify-center h-[200px]">
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    className="w-full bg-primary group-hover:bg-primary transition-all duration-300 rounded-t-[4px] relative cursor-pointer min-h-[8px]"
                >
                    <div className="absolute inset-x-0 top-0 h-1 bg-primary/30 rounded-t-[4px]" />
                </motion.div>
            </div>
        </div>
    );
};

export default function AdminDashboard() {
    const {
        loadUsers,
        loadWithdrawals,
        loadGifts,
        loadCampaigns,
        loadLedger,
        loadPosts,
        computePRDMetrics,
        prdMetrics,
        users,
        usersData,
        withdrawals,
        campaigns,
        posts,
        isLoading
    } = useAdminStore();

    useEffect(() => {
        const syncAll = async () => {
            await Promise.all([
                loadUsers(),
                loadWithdrawals(),
                loadGifts(),
                loadCampaigns(),
                loadLedger(),
                loadPosts(),
                computePRDMetrics()
            ]);
        };
        syncAll();
    }, [loadUsers, loadWithdrawals, loadGifts, loadCampaigns, loadLedger, loadPosts, computePRDMetrics]);

    const totalUsers = usersData?.total ?? users.length;
    const activeMandates = campaigns.filter(c => c.status === 'Active').length;
    const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;
    const flaggedPostsCount = posts.filter(p => p.status === 'Flagged' || p.status === 'Urgent').length;

    const summaryStats = [
        {
            label: 'Active Creators',
            value: totalUsers.toLocaleString(),
            change: 'Total registered',
            icon: Users,
            color: 'blue-500',
            path: '/admin/users'
        },
        {
            label: 'Brand Mandates',
            value: activeMandates.toString(),
            change: `Total ${campaigns.length}`,
            icon: Target,
            color: 'primary',
            path: '/admin/campaigns'
        },
        {
            label: 'Pending Liquidation',
            value: pendingWithdrawalsCount.toString(),
            change: `Latency ${prdMetrics?.payoutLatency || 'n/a'}`,
            icon: Clock,
            color: 'amber-500',
            path: '/admin/withdrawals'
        },
        {
            label: 'Content Risks',
            value: flaggedPostsCount.toString(),
            change: 'Action Required',
            icon: AlertCircle,
            color: 'rose-500',
            path: '/admin/moderation'
        },
    ];
    return (
        <div className="space-y-6 pb-20">
            <AdminPageHeader
                title="Strategic Control Center"
                subtitle="High-fidelity telemetry for the SocialEarn reward ecosystem."
                actions={
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text"
                    >
                        <BarChart3 className={`w-3.5 h-3.5 ${isLoading ? 'animate-pulse text-primary' : ''}`} />
                        Sync Intelligence
                    </button>
                }
            />

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {summaryStats.map((stat, i) => (
                    <AdminStatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        change={stat.change}
                        icon={stat.icon}
                        color={stat.color}
                        path={stat.path}
                        delay={i * 0.05}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
                {/* Revenue Analytics */}
                <div className="xl:col-span-4 bg-surface border border-surface rounded-lg p-6 flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text">Protocol Yields</h3>
                            <p className="text-[9px] text-muted font-medium uppercase tracking-wider mt-1 opacity-60">Daily Volume Performance</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase tracking-wider px-2 py-1 bg-emerald-500/5 rounded-md border border-emerald-500/10">
                                <TrendingUp className="w-3 h-3" /> +14.2%
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 w-full bg-surface2/50 rounded-lg border border-surface p-8 flex items-end justify-between gap-3 relative group mt-auto min-h-[250px]">
                        {[45, 65, 30, 85, 55, 95, 75, 40, 60, 80, 50, 90].map((h, i) => (
                            <ChartBar key={i} height={h} value={`${getCurrency()}${h * 120}`} />
                        ))}
                    </div>
                </div>

                {/* Secondary Engagement Chart */}
                <div className="xl:col-span-2 bg-surface border border-surface rounded-lg p-6 flex flex-col h-[400px]">
                    <div className="mb-8">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text">Engagement Density</h3>
                        <p className="text-[9px] text-muted font-medium uppercase tracking-wider mt-1 opacity-60">User Interaction Flux</p>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            {[
                                { label: 'Task Discovery', value: 82, color: 'blue-500' },
                                { label: 'Brand Interaction', value: 64, color: 'primary' },
                                { label: 'Asset Liquidation', value: 45, color: 'emerald-500' },
                                { label: 'Social Echoes', value: 91, color: 'purple-500' },
                            ].map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                                        <span className="text-muted">{item.label}</span>
                                        <span className="text-text">{item.value}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-bg rounded-full overflow-hidden border border-surface">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.value}%` }}
                                            className={`h-full bg-${item.color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-4 bg-bg border border-surface rounded-lg flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-surface">
                                <Activity className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-text uppercase tracking-widest">Global Pulse</p>
                                <p className="text-[9px] text-muted font-medium uppercase tracking-wider">Highly Optimistic</p>
                            </div>
                            <ArrowUpRight className="ml-auto w-4 h-4 text-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Security Alerts */}
                <div className="bg-surface border border-surface rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-bold text-rose-500 flex items-center gap-2 uppercase tracking-widest">
                            <AlertCircle className="w-4 h-4" />
                            Security Anomalies
                        </h3>
                        <button className="text-[9px] font-bold uppercase tracking-wider text-muted hover:text-rose-500 transition-colors">Resolve All</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { type: 'Fraud', msg: 'IP Cluster Collision detected', user: '@whale_88', color: 'rose-500' },
                            { type: 'Bot', msg: 'High-Velocity voting pattern', user: '@memelord', color: 'amber-500' },
                        ].map((alert, i) => (
                            <div key={i} className="p-4 bg-bg border border-surface rounded-lg hover:border-rose-500/20 transition-all cursor-pointer group">
                                <span className={`text-[8px] font-bold uppercase tracking-widest text-${alert.color} mb-2 block`}>{alert.type} Node</span>
                                <p className="text-xs font-semibold mb-2 group-hover:text-rose-500 transition-colors">{alert.msg}</p>
                                <p className="text-[9px] text-muted font-medium uppercase tracking-wider italic">Actor: <span className="text-text">{alert.user}</span></p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Infrastructure Status */}
                <div className="bg-primary/95 border border-primary/20 rounded-lg p-6 text-black relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-base font-bold tracking-tight mb-1">Operational Health</h3>
                        <p className="text-[9px] font-bold text-black/60 mb-6 uppercase tracking-[0.2em]">Node-Alpha Connected</p>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div>
                                <p className="text-[9px] font-bold text-black/40 uppercase mb-1">CPU Load</p>
                                <p className="text-lg font-bold">12%</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-black/40 uppercase mb-1">Mem Flux</p>
                                <p className="text-lg font-bold">4.2 GB</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-black/40 uppercase mb-1">Uptime</p>
                                <p className="text-lg font-bold">99.9%</p>
                            </div>
                        </div>

                        <button className="flex items-center gap-2 text-[10px] font-bold group-hover:gap-3 transition-all uppercase tracking-widest border-b-2 border-black/10 pb-1">
                            System Diagnostics <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    <Cpu className="absolute -right-4 -bottom-4 w-32 h-32 text-black/5 rotate-12" />
                </div>
            </div>
        </div>
    );
}

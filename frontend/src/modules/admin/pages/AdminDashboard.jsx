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
import Avatar from '../../user/components/shared/Avatar';

const summaryStats = [
    {
        label: 'Platform Revenue',
        value: formatCurrency(124502.80),
        change: '+12.5%',
        icon: DollarSign,
        color: 'emerald-500',
        path: '/admin/wallet'
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
        loadDashboardStats,
        dashboardStats,
        isLoading
    } = useAdminStore();

    useEffect(() => {
        loadDashboardStats();
    }, [loadDashboardStats]);

    const stats = [
        {
            label: 'Total Revenue',
            value: formatCurrency(dashboardStats?.totalRevenue || 0),
            change: 'Lifetime earnings',
            icon: DollarSign,
            color: 'emerald-500',
            path: '/admin/wallet'
        },
        {
            label: 'Total Creators',
            value: (dashboardStats?.totalUsers || 0).toLocaleString(),
            change: 'Registered users',
            icon: Users,
            color: 'blue-500',
            path: '/admin/users'
        },
        {
            label: 'Protocol Content',
            value: (dashboardStats?.totalContent || 0).toLocaleString(),
            change: 'Total posts & reels',
            icon: Target,
            color: 'primary',
            path: '/admin/content'
        },

        {
            label: 'Growth Velocity',
            value: '+12.5%',
            change: 'Month over month',
            icon: TrendingUp,
            color: 'purple-500',
            path: '#'
        },
        {
            label: 'System Health',
            value: '99.9%',
            change: 'All nodes online',
            icon: Activity,
            color: 'amber-500',
            path: '/admin/settings'
        },
    ];

    // Prepare graph data from revenueByMonth
    // We expect an array of { _id: { month, year }, amount }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const graphData = (dashboardStats?.revenueByMonth || []).map(item => ({
        label: `${months[item._id.month - 1]}`,
        value: item.amount,
        height: Math.min(100, (item.amount / (Math.max(...(dashboardStats?.revenueByMonth || [1]).map(i => i.amount)) || 1)) * 100)
    }));

    // If less than 6 months, pad it
    while (graphData.length < 6) {
        graphData.unshift({ label: '---', value: 0, height: 10 });
    }

    return (
        <div className="space-y-6 pb-20">
            <AdminPageHeader
                title="Strategic Control Center"
                subtitle="High-fidelity telemetry for the platform reward ecosystem."
                actions={
                    <button
                        onClick={() => loadDashboardStats()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-surface2 transition-all text-text"
                    >
                        <BarChart3 className={`w-3.5 h-3.5 ${isLoading ? 'animate-pulse text-primary' : ''}`} />
                        Sync Intelligence
                    </button>
                }
            />

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {stats.map((stat, i) => (
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
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text">Revenue Performance</h3>
                            <p className="text-[9px] text-muted font-medium uppercase tracking-wider mt-1 opacity-60">Monthly Yield Analysis</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full bg-surface2/50 rounded-lg border border-surface p-8 flex items-end justify-around gap-3 relative group mt-auto min-h-[250px]">
                        {graphData.map((d, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group">
                                <ChartBar height={d.height} value={formatCurrency(d.value)} />
                                <span className="text-[8px] font-bold text-muted uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">{d.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Secondary Engagement Card */}
                <div className="xl:col-span-2 bg-surface border border-surface rounded-lg p-6 flex flex-col h-[400px]">
                    <div className="mb-8">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text">Platform Distribution</h3>
                        <p className="text-[9px] text-muted font-medium uppercase tracking-wider mt-1 opacity-60">User Interaction Flux</p>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            {[
                                { label: 'Active Sessions', value: 82, color: 'blue-500' },
                                { label: 'Gift Exchanges', value: 64, color: 'primary' },
                                { label: 'Post Velocity', value: 45, color: 'emerald-500' },
                                { label: 'Ad Engagement', value: 91, color: 'purple-500' },
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
                {/* Recent Users List */}
                <div className="bg-surface border border-surface rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-bold text-text flex items-center gap-2 uppercase tracking-widest">
                            <Users className="w-4 h-4 text-blue-500" />
                            Recent Onboarding
                        </h3>
                        <button className="text-[9px] font-bold uppercase tracking-wider text-muted hover:text-primary transition-colors">View All</button>
                    </div>
                    <div className="space-y-3">
                        {dashboardStats?.recentUsers?.map((user, i) => (
                            <div key={user._id} className="flex items-center gap-3 p-3 bg-bg border border-surface rounded-lg hover:border-primary/20 transition-all group cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-surface2 border border-surface overflow-hidden">
                                    <Avatar src={user.avatar} size="w-full h-full" alt={user.name} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">{user.name}</p>
                                    <p className="text-[9px] text-muted font-medium uppercase tracking-wider truncate">{user.handle || user.email}</p>
                                </div>
                                <div className="text-right">
                                    <span className="px-2 py-0.5 rounded bg-surface2 border border-surface text-[8px] font-bold text-muted uppercase tracking-widest">
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {!dashboardStats?.recentUsers?.length && (
                            <p className="text-center py-10 text-[10px] text-muted uppercase font-bold opacity-40">No recent users detected</p>
                        )}
                    </div>
                </div>

                {/* Recent Transactions List */}
                <div className="bg-surface border border-surface rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-bold text-text flex items-center gap-2 uppercase tracking-widest">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            Live Transactions
                        </h3>
                        <button className="text-[9px] font-bold uppercase tracking-wider text-muted hover:text-emerald-500 transition-colors">Audit Ledger</button>
                    </div>
                    <div className="space-y-3">
                        {dashboardStats?.recentTransactions?.map((tx, i) => (
                            <div key={tx._id} className="flex items-center gap-3 p-3 bg-bg border border-surface rounded-lg hover:border-emerald-500/20 transition-all group">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-text truncate">
                                        {tx.userId?.name || 'Unknown User'}
                                    </p>
                                    <p className="text-[9px] text-muted font-medium uppercase tracking-wider truncate">
                                        {tx.type} • {new Date(tx.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-emerald-500 tracking-tight">
                                        +{tx.amount ? formatCurrency(tx.amount) : `${tx.coins} Coins`}
                                    </p>
                                    <span className="text-[8px] font-bold text-muted uppercase tracking-widest opacity-60">Success</span>
                                </div>
                            </div>
                        ))}
                        {!dashboardStats?.recentTransactions?.length && (
                            <p className="text-center py-10 text-[10px] text-muted uppercase font-bold opacity-40">Idle transaction layer</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


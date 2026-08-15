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
    Cpu,
    Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
    const {
        loadDashboardStats,
        dashboardStats,
        exchangeRates,
        countries,
        loadCountries,
        isLoading,
        dashboardSearchQuery
    } = useAdminStore();

    useEffect(() => {
        loadDashboardStats();
        loadCountries();
    }, [loadDashboardStats, loadCountries]);

    useEffect(() => {
        console.log("Dashboard Stats:", dashboardStats);
    }, [dashboardStats]);

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

    // Build full 12-month graph data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [chartView, setChartView] = useState('12M');
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed (0=Jan)
    const currentYear = now.getFullYear();

    // Build a rolling 12-month timeline (month+year aware)
    // Each slot = one calendar month going back from today
    const rollingSlots = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(currentYear, currentMonth - (11 - i), 1);
        return { label: months[d.getMonth()], month: d.getMonth() + 1, year: d.getFullYear(), isFuture: false };
    });

    // Map revenue keyed by "year-month"
    const revenueMap = {};
    (dashboardStats?.revenueByMonth || []).forEach(item => {
        const key = `${item._id.year}-${item._id.month}`;
        revenueMap[key] = (revenueMap[key] || 0) + item.amount;
    });

    // Fill rolling slots with real values
    const fullYearData = rollingSlots.map(slot => ({
        ...slot,
        value: revenueMap[`${slot.year}-${slot.month}`] || 0
    }));

    // Apply 6M / 12M filter
    const displayData = chartView === '6M'
        ? fullYearData.slice(6)   // last 6 of the 12 rolling slots
        : fullYearData;

    const maxRevenue = Math.max(...displayData.map(d => d.value), 1);
    const totalRevenue = displayData.reduce((s, d) => s + d.value, 0);
    const peakMonth = displayData.reduce((p, c) => c.value > p.value ? c : p, displayData[0]);

    // Use sqrt scale so small bars stay visible relative to dominant months
    const getBarHeight = (value) => {
        if (value <= 0) return 1;
        const sqrtMax = Math.sqrt(maxRevenue);
        const sqrtVal = Math.sqrt(value);
        return Math.max((sqrtVal / sqrtMax) * 100, 5); // min 5%
    };

    // Y-axis steps still use linear scale for readability
    const ySteps = [0.25, 0.5, 0.75, 1].map(f => ({
        value: maxRevenue * f,
        pct: f * 100
    }));


    // Filtered lists based on topbar universal search
    const q = (dashboardSearchQuery || '').toLowerCase();
    const filteredUsers = (dashboardStats?.recentUsers || []).filter(u =>
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.handle || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
    );
    const filteredTxns = (dashboardStats?.recentTransactions || []).filter(tx =>
        !q ||
        (tx.userId?.name || '').toLowerCase().includes(q) ||
        (tx.type || '').toLowerCase().includes(q) ||
        String(tx.amount || tx.coins || '').includes(q)
    );

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
                <div className="xl:col-span-4 bg-surface border border-surface rounded-lg p-6 flex flex-col" style={{ minHeight: '420px' }}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text">Revenue Performance</h3>
                            <p className="text-[9px] text-muted font-medium uppercase tracking-wider mt-1 opacity-60">Monthly Yield Analysis</p>
                        </div>
                        {/* View toggle */}
                        <div className="flex items-center gap-1 bg-bg border border-surface rounded-lg p-1">
                            {['6M', '12M'].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setChartView(v)}
                                    className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all ${
                                        chartView === v
                                            ? 'bg-primary text-black'
                                            : 'text-muted hover:text-text'
                                    }`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chart area */}
                    <div className="flex-1 flex gap-3 relative" style={{ minHeight: '280px' }}>
                        {/* Y-axis labels */}
                        <div className="flex flex-col justify-between items-end pb-8 shrink-0" style={{ width: '52px' }}>
                            {[...ySteps].reverse().map((step, i) => (
                                <span key={i} className="text-[8px] font-bold text-muted/60 uppercase tracking-wider leading-none">
                                    {step.value >= 100000
                                        ? `₹${(step.value / 100000).toFixed(1)}L`
                                        : step.value >= 1000
                                            ? `₹${(step.value / 1000).toFixed(0)}K`
                                            : `₹${step.value.toFixed(0)}`
                                    }
                                </span>
                            ))}
                            <span className="text-[8px] font-bold text-muted/40">₹0</span>
                        </div>

                        {/* Bars + grid */}
                        <div className="flex-1 relative flex flex-col">
                            {/* Horizontal grid lines */}
                            <div className="absolute inset-0 bottom-8 flex flex-col justify-between pointer-events-none">
                                {[...ySteps, { pct: 0 }].map((step, i) => (
                                    <div key={i} className="w-full border-t border-surface/60" />
                                ))}
                            </div>

                            {/* Bars row */}
                            <div className="flex-1 flex items-end gap-1.5 px-1 pb-0">
                                {displayData.map((d, i) => {
                                    const heightPct = getBarHeight(d.value);
                                    const isPeak = d.value === maxRevenue && d.value > 0;
                                    return (
                                        <div
                                            key={d.month}
                                            className="flex-1 flex flex-col items-center justify-end h-full group relative"
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-20">
                                                <div className="bg-text text-bg text-[9px] font-black px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                                    <p className="uppercase tracking-wider">{d.label}</p>
                                                    <p className="text-primary mt-0.5">
                                                        {d.value > 0 ? formatCurrency(d.value) : 'No revenue'}
                                                    </p>
                                                </div>
                                                <div className="w-2 h-2 bg-text rotate-45 mx-auto -mt-1" />
                                            </div>

                                            {/* Bar */}
                                            <motion.div
                                                key={`${d.month}-${chartView}`}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${heightPct}%` }}
                                                transition={{ duration: 0.5, delay: i * 0.03, ease: 'easeOut' }}
                                                className={`w-full rounded-t-[3px] transition-all cursor-pointer ${
                                                    d.isFuture
                                                        ? 'bg-surface2 border border-dashed border-surface'
                                                        : isPeak
                                                            ? 'bg-primary group-hover:brightness-110'
                                                            : d.value > 0
                                                                ? 'bg-primary opacity-70 group-hover:opacity-100'
                                                                : 'bg-surface2'
                                                }`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Month labels */}
                            <div className="flex gap-1.5 px-1 pt-2" style={{ height: '32px' }}>
                                {displayData.map((d) => (
                                    <div key={d.month} className="flex-1 flex items-center justify-center">
                                        <span className={`text-[8px] font-black uppercase tracking-wider ${
                                            d.isFuture ? 'text-muted/30' : 'text-muted/70'
                                        }`}>{d.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary strip */}
                    <div className="flex items-center gap-6 pt-4 mt-2 border-t border-surface">
                        <div>
                            <p className="text-[8px] text-muted uppercase tracking-widest font-bold">Period Total</p>
                            <p className="text-sm font-black text-text mt-0.5">{formatCurrency(totalRevenue)}</p>
                        </div>
                        <div className="h-8 w-px bg-surface" />
                        <div>
                            <p className="text-[8px] text-muted uppercase tracking-widest font-bold">Peak Month</p>
                            <p className="text-sm font-black text-primary mt-0.5">
                                {peakMonth?.value > 0 ? `${peakMonth.label} — ${formatCurrency(peakMonth.value)}` : '—'}
                            </p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                            <span className="text-[8px] text-muted font-bold uppercase tracking-wider">Revenue</span>
                            <div className="w-2.5 h-2.5 rounded-sm bg-surface2 border border-dashed border-surface ml-3" />
                            <span className="text-[8px] text-muted font-bold uppercase tracking-wider">Upcoming</span>
                        </div>
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
                            {q && <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">Filtered</span>}
                        </h3>
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="text-[9px] font-bold uppercase tracking-wider text-muted hover:text-primary transition-colors"
                        >
                            View All
                        </button>
                    </div>
                    <div className="space-y-3">
                        {filteredUsers.map((user) => (
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
                        {filteredUsers.length === 0 && (
                            <p className="text-center py-10 text-[10px] text-muted uppercase font-bold opacity-40">
                                {q ? `No users matching "${dashboardSearchQuery}"` : 'No recent users detected'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Recent Transactions List */}
                <div className="bg-surface border border-surface rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-bold text-text flex items-center gap-2 uppercase tracking-widest">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            Live Transactions
                            {q && <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">Filtered</span>}
                        </h3>
                        <button
                            onClick={() => navigate('/admin/wallet')}
                            className="text-[9px] font-bold uppercase tracking-wider text-muted hover:text-emerald-500 transition-colors"
                        >
                            Audit Ledger
                        </button>
                    </div>
                    <div className="space-y-3">
                        {filteredTxns.map((tx) => (
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
                        {filteredTxns.length === 0 && (
                            <p className="text-center py-10 text-[10px] text-muted uppercase font-bold opacity-40">
                                {q ? `No transactions matching "${dashboardSearchQuery}"` : 'Idle transaction layer'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Country Protocol & Market Intelligence */}
            {exchangeRates && countries.length > 0 && (
                <div className="bg-surface border border-surface rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-[10px] font-bold text-text flex items-center gap-2 uppercase tracking-widest">
                                <Globe className="w-4 h-4 text-primary" />
                                Active Country Protocol
                            </h3>
                            <p className="text-[9px] text-muted font-medium uppercase tracking-wider mt-1 opacity-60">Real-time valuation across registered nodes</p>
                        </div>
                        <span className="text-[8px] font-bold text-muted uppercase tracking-wider bg-surface2 px-3 py-1 rounded-full border border-surface">
                            Pulse: {exchangeRates.lastUpdate || 'Live'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {countries.map((country) => {
                            const rate = (exchangeRates.INR / exchangeRates[country.currencyCode])?.toFixed(4);
                            return (
                                <div key={country.code} className="p-4 bg-bg border border-surface rounded-lg flex items-center gap-4 group hover:border-primary/30 transition-all cursor-default">
                                    <div className="w-10 h-10 rounded-lg bg-surface2 flex items-center justify-center text-xl border border-surface">
                                        {country.flag}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest truncate">{country.name}</p>
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[7px] font-black text-emerald-500 uppercase">Live</span>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-text mt-0.5">
                                            {rate ? `₹${rate}` : '---'}
                                            <span className="text-[8px] text-muted ml-1.5 font-bold">/ {country.currencyCode}</span>
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}


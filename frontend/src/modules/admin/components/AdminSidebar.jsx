import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FileText,
    Trophy,
    Vote,
    Wallet,
    Send,
    History,
    Gift,
    ShieldAlert,
    Terminal,
    Globe,
    Bell,
    Box,
    ShieldCheck,
    Cpu,
    Target,
    BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuGroups = [
    {
        title: 'Strategic Insights',
        items: [
            { icon: LayoutDashboard, label: 'Control Center', path: '/admin' },
        ]
    },
    {
        title: 'Social Protocols',
        items: [
            { icon: Users, label: 'User Intelligence', path: '/admin/users' },
            { icon: FileText, label: 'Media Moderation', path: '/admin/content' },
            { icon: Target, label: 'Brand Mandates', path: '/admin/campaigns' },
            { icon: Vote, label: 'Protocol Voting', path: '/admin/voting' },
            { icon: Box, label: 'Asset Registry', path: '/admin/nfts' },
        ]
    },
    {
        title: 'Rewards & Liquidity',
        items: [
            { icon: Wallet, label: 'Vault Liquidity', path: '/admin/wallet' },
            { icon: Send, label: 'Payout Queue', path: '/admin/withdrawals', badge: 12 },
            { icon: History, label: 'Profitability Logic', path: '/admin/financials' },
            { icon: Gift, label: 'Tokenomics & Gifts', path: '/admin/gifts' },
        ]
    },
    {
        title: 'Trust & Safety',
        items: [
            { icon: ShieldAlert, label: 'Threat Monitoring', path: '/admin/fraud' },
            { icon: Terminal, label: 'Ledger Integrity', path: '/admin/audit' },
        ]
    },
    {
        title: 'Infrastructure',
        items: [
            { icon: Globe, label: 'Node Parameters', path: '/admin/settings' },
            { icon: Bell, label: 'System Comms', path: '/admin/notifications' },
        ]
    }
];

export default function AdminSidebar({ isCollapsed, setIsCollapsed }) {
    return (
        <motion.div
            animate={{ width: isCollapsed ? 80 : 260 }}
            className="bg-surface border-r border-surface h-screen sticky top-0 flex flex-col z-50 transition-all duration-300 ease-in-out"
        >
            {/* Header / Brand */}
            <div className="h-16 flex items-center px-5 border-b border-surface/50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                        <ShieldCheck className="text-black w-5 h-5" />
                    </div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="overflow-hidden whitespace-nowrap"
                            >
                                <h2 className="text-sm font-bold tracking-tight text-text">SocialEarn</h2>
                                <p className="text-[9px] text-muted font-semibold uppercase tracking-widest mt-0.5 opacity-60">Admin Node</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Menu Sections */}
            <div className="flex-1 overflow-y-auto hide-scrollbar py-6 px-3 space-y-8">
                {menuGroups.map((group, gIdx) => (
                    <div key={group.title}>
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-[9px] font-semibold text-muted uppercase tracking-[0.15em] px-3 mb-3 opacity-40"
                                >
                                    {group.title}
                                </motion.p>
                            )}
                        </AnimatePresence>
                        <div className="space-y-1">
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === '/admin'}
                                    className={({ isActive }) => `
                                        flex items-center group relative px-3 py-2 rounded-lg transition-all duration-200
                                        ${isActive
                                            ? 'bg-primary/5 text-primary border border-primary/10'
                                            : 'text-sub hover:bg-surface2 hover:text-text border border-transparent'}
                                    `}
                                >
                                    <div className={`p-1.5 rounded-md transition-colors ${isCollapsed ? 'mx-auto' : 'mr-3'}`}>
                                        <item.icon className="w-4 h-4 shrink-0" />
                                    </div>

                                    <AnimatePresence>
                                        {!isCollapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -5 }}
                                                className="text-[11px] font-semibold uppercase tracking-wider flex-1 truncate"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>

                                    {!isCollapsed && item.badge && (
                                        <span className="bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                                            {item.badge}
                                        </span>
                                    )}

                                    {/* Active Indicator */}
                                    <div className={`absolute left-0 w-1 h-4 bg-primary rounded-r-full transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`} style={{ opacity: window.location.pathname === item.path ? 1 : 0 }} />
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* User Profile Hook */}
            <div className="p-4 border-t border-surface/50">
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'p-2.5 bg-surface2/50 rounded-lg border border-surface group cursor-pointer hover:bg-surface2 transition-all'}`}>
                    <div className="w-8 h-8 rounded-lg bg-bg border border-surface flex items-center justify-center font-bold text-[10px] text-primary shrink-0">
                        SA
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold truncate text-text uppercase tracking-wider leading-none mb-1">SuperAdmin</p>
                            <p className="text-[8px] text-muted truncate uppercase font-medium">Session: Active</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

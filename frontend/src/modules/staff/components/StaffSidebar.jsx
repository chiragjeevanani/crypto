import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, FileText, Trophy, Vote, Wallet,
    Send, Gift, Music, ShieldAlert, Terminal, Globe, Box,
    Tags, ShieldCheck, Target, PanelLeftClose, ChevronDown,
    Gavel, Sparkles, UserCircle, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useStaffStore } from '../store/useStaffStore';
import { useNavigate } from 'react-router-dom';

// All possible sidebar menu items — each tagged with a key that matches grantedMenus[]
const ALL_MENU_GROUPS = [
    {
        title: 'Overview',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/staff', key: 'dashboard', exact: true },
        ]
    },
    {
        title: 'Users & Content',
        items: [
            { icon: Users, label: 'Users', path: '/staff/users', key: 'users' },
            { icon: FileText, label: 'Content', path: '/staff/content', key: 'content' },
            { icon: Tags, label: 'Categories', path: '/staff/categories', key: 'categories' },
            { icon: Box, label: 'V-World Review', path: '/staff/nfts', key: 'nfts' },
            { icon: Vote, label: 'Voting', path: '/staff/voting', key: 'voting' },
            { icon: Music, label: 'Music', path: '/staff/music', key: 'music' },
            { icon: Gavel, label: 'Auctions', path: '/staff/auctions', key: 'auctions' },
            { icon: Globe, label: 'Locations', path: '/staff/locations', key: 'locations' },
        ]
    },
    {
        title: 'Campaigns',
        items: [
            { icon: Target, label: 'Campaigns', path: '/staff/campaigns', key: 'campaigns' },
            { icon: Users, label: 'Advertisers', path: '/staff/advertisers', key: 'advertisers' },
            { icon: Sparkles, label: 'Trending Deals', path: '/staff/deals', key: 'deals' },
        ]
    },
    {
        title: 'Money',
        items: [
            { icon: Wallet, label: 'Wallet', path: '/staff/wallet', key: 'wallet' },
            { icon: Send, label: 'Withdrawals', path: '/staff/withdrawals', key: 'withdrawals' },
            { icon: Gift, label: 'Gifts', path: '/staff/gifts', key: 'gifts' },
        ]
    },
    {
        title: 'Safety',
        items: [
            { icon: ShieldAlert, label: 'Reports', path: '/staff/reports', key: 'reports' },
            { icon: Terminal, label: 'Audit Logs', path: '/staff/audit', key: 'audit' },
            { icon: ShieldCheck, label: 'KYC Management', path: '/staff/kyc', key: 'kyc' },
        ]
    },
    {
        title: 'Settings',
        items: [
            { icon: Globe, label: 'Platform Settings', path: '/staff/settings', key: 'settings' },
        ]
    },
];

const ROLE_LABELS = { staff: 'Staff', team_leader: 'Team Leader' };

export default function StaffSidebar({ isCollapsed, closeMobile }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { staff, logoutStaff } = useStaffStore();
    const [expandedItems, setExpandedItems] = useState({});

    const grantedMenus = staff?.grantedMenus || [];

    // Filter groups to only show items the staff member has access to
    const visibleGroups = ALL_MENU_GROUPS
        .map(group => ({
            ...group,
            items: group.items.filter(item => grantedMenus.includes(item.key))
        }))
        .filter(group => group.items.length > 0);

    const handleLogout = () => {
        logoutStaff();
        navigate('/staff/login');
    };

    return (
        <motion.div
            animate={{ width: isCollapsed ? 80 : 260 }}
            className="bg-surface border-r border-surface h-screen sticky top-0 flex flex-col z-50 transition-all duration-300 ease-in-out"
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-surface/50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
                        <Users className="text-indigo-400 w-4 h-4" />
                    </div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="overflow-hidden whitespace-nowrap"
                            >
                                <h2 className="text-sm font-bold tracking-tight text-text">KnQ Reels</h2>
                                <p className="text-[9px] text-indigo-400 font-semibold uppercase tracking-widest mt-0.5">
                                    Staff Portal
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button onClick={closeMobile} className="lg:hidden p-2 hover:bg-surface2 rounded-lg transition-colors text-muted">
                    <PanelLeftClose className="w-4 h-4" />
                </button>
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto hide-scrollbar py-6 px-3 space-y-8">
                {visibleGroups.length === 0 ? (
                    <div className="px-3 text-center">
                        <p className="text-[10px] text-muted opacity-50">No menus assigned yet.<br />Contact your admin.</p>
                    </div>
                ) : (
                    visibleGroups.map((group) => (
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
                                {group.items.map((item) => {
                                    const isActive = item.exact
                                        ? location.pathname === item.path
                                        : location.pathname.startsWith(item.path);
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={closeMobile}
                                            end={item.exact}
                                            className={() => `
                                                flex items-center group relative px-3 py-2 rounded-lg transition-all duration-200
                                                ${isActive
                                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
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
                                                        className="text-[11px] font-semibold uppercase tracking-wider truncate"
                                                    >
                                                        {item.label}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer: Staff info + logout */}
            <div className="p-4 border-t border-surface/50 space-y-2">
                {/* Profile link */}
                <NavLink
                    to="/staff/profile"
                    className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-muted hover:text-text hover:bg-surface2'}`}
                >
                    <UserCircle className="w-4 h-4 shrink-0" />
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-bold uppercase tracking-wider">
                                My Profile
                            </motion.span>
                        )}
                    </AnimatePresence>
                </NavLink>

                {/* Staff info card */}
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'p-2.5 bg-indigo-500/5 rounded-lg border border-indigo-500/10'}`}>
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-[10px] text-indigo-400 shrink-0">
                        {staff?.name?.[0]?.toUpperCase() || 'S'}
                    </div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                                <p className="text-[10px] font-extrabold truncate text-indigo-400 uppercase tracking-wider leading-none mb-1">
                                    {ROLE_LABELS[staff?.role] || 'Staff'}
                                </p>
                                <p className="text-[8px] text-muted truncate uppercase font-bold">{staff?.name || ''}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/5 transition-all ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-bold uppercase tracking-wider">
                                Sign Out
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.div>
    );
}

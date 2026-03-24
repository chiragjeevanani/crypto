import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    User,
    FileText,
    Trophy,
    Vote,
    Wallet,
    Send,
    History,
    Gift,
    Music,
    ShieldAlert,
    Terminal,
    Globe,
    Box,
    Tags,
    ShieldCheck,
    Target,
    PanelLeftClose,
    ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useUserStore } from '../../user/store/useUserStore';
import { simplifyAdminCopy } from '../utils/simplifyCopy';
import { getRoleLabel, getRoleHandle } from '../utils/roleDisplay';

const menuGroups = [
    {
        title: 'Overview',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        ]
    },
    {
        title: 'Users & Content',
        items: [
            {
                icon: Users,
                label: 'Users',
                path: '/admin/users',
                children: [
                    { label: 'All Users', path: '/admin/users' },
                    { label: 'Create User', path: '/admin/users/new' }
                ]
            },
            {
                icon: FileText,
                label: 'Content',
                path: '/admin/content',
            },
            { icon: Tags, label: 'Categories', path: '/admin/categories' },
            { icon: Box, label: 'NFT Review', path: '/admin/nfts' },
            { icon: Vote, label: 'Voting', path: '/admin/voting' },
            { icon: Music, label: 'Music', path: '/admin/music' },
        ]
    },
    {
        title: 'Campaigns',
        items: [
            {
                icon: Target,
                label: 'Campaigns',
                path: '/admin/campaigns',
                children: [
                    { label: 'All Campaigns', path: '/admin/campaigns' },
                    { label: 'Create Campaign', path: '/admin/campaigns/new' }
                ]
            },
            { icon: Users, label: 'Advertisers', path: '/admin/advertisers' },
        ]
    },
    {
        title: 'Money',
        items: [
            { icon: Wallet, label: 'Wallet Overview', path: '/admin/wallet' },
            { icon: Send, label: 'Withdrawals', path: '/admin/withdrawals', badge: 12 },
            {
                icon: Gift,
                label: 'Gifts',
                path: '/admin/gifts',
                children: [
                    { label: 'Gift List', path: '/admin/gifts' },
                    { label: 'Add Gift', path: '/admin/gifts/create' },
                    { label: 'Deleted Gifts', path: '/admin/gifts/trash' }
                ]
            },
            { icon: History, label: 'Finance Rules', path: '/admin/financials' },
        ]
    },
    {
        title: 'Safety',
        items: [
            { icon: ShieldAlert, label: 'Fraud Checks', path: '/admin/fraud' },
            { icon: Terminal, label: 'Audit Logs', path: '/admin/audit' },
        ]
    },
    {
        title: 'Settings',
        items: [
            { icon: User, label: 'My Profile', path: '/admin/profile' },
            {
                icon: Globe,
                label: 'Platform Settings',
                path: '/admin/settings',
                children: [
                    { label: 'Finance', path: '/admin/settings/financial' },
                    { label: 'Security', path: '/admin/settings/security' },
                    { label: 'Network', path: '/admin/settings/network' }
                ]
            },
        ]
    }
];

export default function AdminSidebar({ isCollapsed, setIsCollapsed, closeMobile }) {
    const [expandedItems, setExpandedItems] = useState({});
    const location = useLocation();
    const { user, profile } = useUserStore();

    const toggleSubmenu = (label) => {
        setExpandedItems(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    return (
        <motion.div
            animate={{ width: isCollapsed ? 80 : 260 }}
            className="bg-surface border-r border-surface h-screen sticky top-0 flex flex-col z-50 transition-all duration-300 ease-in-out"
        >
            {/* Header / Brand */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-surface/50 shrink-0">
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
                                <p className="text-[9px] text-muted font-semibold uppercase tracking-widest mt-0.5 opacity-60">Admin Panel</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={closeMobile}
                    className="lg:hidden p-2 hover:bg-surface2 rounded-lg transition-colors text-muted"
                >
                    <PanelLeftClose className="w-4 h-4" />
                </button>
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
                                    {simplifyAdminCopy(group.title)}
                                </motion.p>
                            )}
                        </AnimatePresence>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const hasChildren = item.children && item.children.length > 0;
                                const isChildActive = hasChildren && item.children.some(child => location.pathname === child.path);
                                const isExpanded = expandedItems[item.label] || isChildActive;
                                const isParentActive = location.pathname === item.path || isChildActive;

                                return (
                                    <div key={item.path}>
                                        <NavLink
                                            to={hasChildren ? '#' : item.path}
                                            onClick={(e) => {
                                                if (hasChildren) {
                                                    e.preventDefault();
                                                    toggleSubmenu(item.label);
                                                } else {
                                                    closeMobile();
                                                }
                                            }}
                                            end={item.path === '/admin'}
                                            className={() => `
                                                flex items-center group relative px-3 py-2 rounded-lg transition-all duration-200
                                                ${isParentActive
                                                    ? 'bg-primary/5 text-primary border border-primary/10'
                                                    : 'text-sub hover:bg-surface2 hover:text-text border border-transparent'}
                                            `}
                                        >
                                            <div className={`p-1.5 rounded-md transition-colors ${isCollapsed ? 'mx-auto' : 'mr-3'}`}>
                                                <item.icon className="w-4 h-4 shrink-0" />
                                            </div>

                                            <AnimatePresence>
                                                {!isCollapsed && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -5 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -5 }}
                                                        className="flex-1 flex items-center justify-between overflow-hidden"
                                                    >
                                                        <span className="text-[11px] font-semibold uppercase tracking-wider truncate">
                                                            {simplifyAdminCopy(item.label)}
                                                        </span>
                                                        {hasChildren && (
                                                            <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                                                <ChevronDown className="w-3 h-3 text-muted" />
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {!isCollapsed && item.badge && !hasChildren && (
                                                <span className="bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </NavLink>

                                        {/* Sub-menu implementation */}
                                        <AnimatePresence>
                                            {!isCollapsed && hasChildren && isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="ml-9 mt-1 space-y-1 border-l border-surface pl-2 py-1">
                                                        {item.children.map((child) => (
                                                            <NavLink
                                                                key={child.path}
                                                                to={child.path}
                                                                onClick={closeMobile}
                                                                className={({ isActive }) => `
                                                                    block py-1.5 px-3 rounded-md text-[9px] font-bold uppercase tracking-[0.1em] transition-all
                                                                    ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:text-text hover:bg-surface2'}
                                                                `}
                                                            >
                                                                {simplifyAdminCopy(child.label)}
                                                            </NavLink>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* User Profile Hook - shows logged-in admin role from DB */}
            <div className="p-4 border-t border-surface/50">
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'p-2.5 bg-surface2/50 rounded-lg border border-surface group cursor-pointer hover:bg-surface2 transition-all'}`}>
                    <div className="w-8 h-8 rounded-lg bg-bg border border-surface flex items-center justify-center font-bold text-[10px] text-primary shrink-0">
                        {(user?.name || getRoleLabel(user?.role)).slice(0, 2).toUpperCase()}
                    </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-extrabold truncate text-primary uppercase tracking-wider leading-none mb-1">
                                {user?.role || 'User'}
                            </p>
                            <p className="text-[8px] text-muted truncate uppercase font-bold">
                                {user?.name || 'Admin'} · Active
                            </p>
                        </div>
                </div>
            </div>
        </motion.div>
    );
}

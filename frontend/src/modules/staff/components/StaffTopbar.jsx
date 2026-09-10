import React from 'react';
import { PanelLeft, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStaffStore } from '../store/useStaffStore';

const ROLE_LABELS = { staff: 'Staff', team_leader: 'Team Leader' };

export default function StaffTopbar({ isCollapsed, setIsCollapsed, setIsMobileMenuOpen }) {
    const { staff } = useStaffStore();

    return (
        <div className="h-16 border-b border-surface bg-surface/80 backdrop-blur-md flex items-center px-4 md:px-6 gap-4 shrink-0 sticky top-0 z-40">
            {/* Mobile hamburger */}
            <button
                id="staff-mobile-menu-btn"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-surface2 rounded-lg transition-colors text-muted"
            >
                <PanelLeft className="w-5 h-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
                id="staff-collapse-btn"
                onClick={() => setIsCollapsed(prev => !prev)}
                className="hidden lg:flex p-2 hover:bg-surface2 rounded-lg transition-colors text-muted"
            >
                <PanelLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>

            {/* Title */}
            <div className="flex-1">
                <h1 className="text-xs font-bold uppercase tracking-widest text-indigo-400 opacity-70">
                    Staff Panel
                </h1>
            </div>

            {/* Profile shortcut */}
            <Link
                to="/staff/profile"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface2 transition-colors group"
            >
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                    {staff?.name?.[0]?.toUpperCase() || 'S'}
                </div>
                <div className="hidden md:block text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text truncate max-w-[120px]">{staff?.name || 'Staff'}</p>
                    <p className="text-[8px] text-muted uppercase tracking-widest">{ROLE_LABELS[staff?.role] || 'Staff'}</p>
                </div>
            </Link>
        </div>
    );
}

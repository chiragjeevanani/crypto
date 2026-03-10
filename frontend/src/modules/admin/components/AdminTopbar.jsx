import React from 'react';
import {
    Search,
    Bell,
    Moon,
    Sun,
    User,
    Settings,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    ChevronRight,
    Command
} from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../../user/store/useUserStore';
import { getRoleLabel, getRoleHandle } from '../utils/roleDisplay';

export default function AdminTopbar({ isCollapsed, setIsCollapsed, setIsMobileMenuOpen }) {
    const { darkMode, toggleDarkMode, logout, user, profile } = useUserStore();
    const location = useLocation();
    const navigate = useNavigate();

    // Generate breadcrumbs from path
    const pathnames = location.pathname.split('/').filter((x) => x);

    return (
        <div className="h-16 bg-bg/80 backdrop-blur-md border-b border-surface sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-6">
                <button
                    onClick={() => {
                        if (window.innerWidth < 1024) {
                            setIsMobileMenuOpen(true);
                        } else {
                            setIsCollapsed(!isCollapsed);
                        }
                    }}
                    className="p-2 hover:bg-surface2 rounded-lg transition-colors text-muted hover:text-text"
                >
                    {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </button>

                {/* Breadcrumbs */}
                <nav className="hidden lg:flex items-center gap-2 text-[10px] uppercase font-semibold tracking-wider text-muted">
                    <Link to="/admin" className="hover:text-primary transition-colors">Infra</Link>
                    {pathnames.slice(1).map((name, index) => {
                        const routeTo = `/${pathnames.slice(0, index + 2).join('/')}`;
                        return (
                            <div key={name} className="flex items-center gap-2">
                                <ChevronRight className="w-3 h-3 opacity-30" />
                                <Link to={routeTo} className="hover:text-primary transition-colors">{name}</Link>
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Global Command Search */}
            <div className="flex-1 max-w-lg mx-12 hidden md:block">
                <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted group-focus-within:text-primary transition-colors">
                        <Search className="w-3.5 h-3.5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Command / Search Search..."
                        className="w-full bg-surface border border-surface rounded-lg py-2 pl-10 pr-12 text-[11px] font-medium focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text placeholder:text-muted/50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-bg border border-surface px-1.5 py-0.5 rounded text-[9px] font-bold text-muted pointer-events-none">
                        <Command className="w-2.5 h-2.5" /> K
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => toggleDarkMode?.()}
                    className="p-2.5 rounded-lg hover:bg-surface2 text-muted transition-colors"
                    title="Toggle Theme"
                >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <button className="relative p-2.5 rounded-lg hover:bg-surface2 text-muted transition-colors" title="System Alerts">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-surface"></span>
                </button>

                <div className="h-5 w-px bg-surface mx-2"></div>

                <div className="relative group">
                    <button className="flex items-center gap-3 p-1 rounded-lg hover:bg-surface2 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-[10px] text-black shadow-md">
                            {(user?.name || 'AD').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="hidden lg:block text-left pr-2">
                            <p className="text-[10px] font-bold text-text leading-tight uppercase tracking-wider truncate max-w-[120px]">{user?.name || getRoleLabel(user?.role)}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                <span className="text-[8px] text-muted font-bold uppercase tracking-widest">{getRoleHandle(user, profile)}</span>
                            </div>
                        </div>
                    </button>

                    {/* Premium Dropdown */}
                    <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right group-hover:translate-y-0 translate-y-1">
                        <div className="w-52 bg-surface border border-surface rounded-lg shadow-2xl p-2">
                            <div className="px-3 py-2 mb-2 border-b border-surface pb-3">
                                <p className="text-[10px] font-bold text-text uppercase tracking-wider truncate">{user?.name || getRoleLabel(user?.role)}</p>
                                <p className="text-[8px] text-muted font-medium mt-0.5 uppercase tracking-wider truncate">{user?.email || '—'}</p>
                                <p className="text-[8px] text-muted/80 mt-0.5">{getRoleHandle(user, profile)} · {getRoleLabel(user?.role)}</p>
                            </div>
                            <Link to="/admin/profile" className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider hover:bg-primary/5 hover:text-primary rounded-md transition-colors text-text group/item">
                                <User className="w-3.5 h-3.5" /> My Profile
                            </Link>
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider hover:bg-primary/5 hover:text-primary rounded-md transition-colors text-text group/item">
                                <Settings className="w-3.5 h-3.5" /> Parameters
                            </button>
                            <div className="h-px bg-surface my-2"></div>
                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/admin/login');
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors"
                            >
                                <LogOut className="w-3.5 h-3.5" /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

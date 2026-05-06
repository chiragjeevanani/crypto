import React, { useEffect } from 'react';
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
import { useAdminStore } from '../store/useAdminStore';
import { getRoleLabel, getRoleHandle } from '../utils/roleDisplay';
import Avatar from '../../user/components/shared/Avatar';
import LogoutConfirmationModal from '../../user/components/shared/LogoutConfirmationModal';

export default function AdminTopbar({ isCollapsed, setIsCollapsed, setIsMobileMenuOpen }) {
    const { darkMode, toggleDarkMode, logout, user, profile } = useUserStore();
    const { 
        adminNotifications, 
        unreadAdminNotificationsCount, 
        loadAdminNotifications, 
        readAdminNotification 
    } = useAdminStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);

    useEffect(() => {
        loadAdminNotifications();
        // Polling for new notifications every 60 seconds
        const timer = setInterval(loadAdminNotifications, 60000);
        return () => clearInterval(timer);
    }, [loadAdminNotifications]);

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

                <div className="relative group/notif">
                    <button 
                        className="relative p-2.5 rounded-lg hover:bg-surface2 text-muted transition-colors" 
                        title="System Alerts"
                    >
                        <Bell className="w-4 h-4" />
                        {unreadAdminNotificationsCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center shadow-[0_2px_8px_rgba(244,63,94,0.4)] border-2 border-surface"
                                style={{ background: '#f43f5e', color: '#fff' }}>
                                {unreadAdminNotificationsCount > 99 ? '99+' : unreadAdminNotificationsCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover/notif:opacity-100 group-hover/notif:visible transition-all duration-200 transform origin-top-right translate-y-1 group-hover/notif:translate-y-0 z-50">
                        <div className="w-80 bg-surface border border-surface rounded-xl shadow-2xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-surface flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-text">Notifications</h3>
                                {unreadAdminNotificationsCount > 0 && (
                                    <button 
                                        onClick={() => readAdminNotification('all')}
                                        className="text-[9px] font-bold text-primary hover:underline uppercase"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                {adminNotifications.length > 0 ? (
                                    adminNotifications.map((notif) => (
                                        <div 
                                            key={notif.id || notif._id}
                                            onClick={() => {
                                                readAdminNotification(notif.id || notif._id);
                                                if (notif.type === 'withdrawal_request') navigate('/admin/withdrawals');
                                                else if (notif.type === 'nft_promotion') navigate('/admin/nfts');
                                                else navigate('/admin');
                                            }}
                                            className={`p-4 border-b border-surface/50 hover:bg-primary/5 transition-colors cursor-pointer relative ${!notif.isRead ? 'bg-primary/[0.02]' : ''}`}
                                        >
                                            {!notif.isRead && (
                                                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full"></div>
                                            )}
                                            <div className="flex items-start gap-3">
                                                <div className={`p-1.5 rounded-lg shrink-0 ${
                                                    notif.type === 'withdrawal_request' ? 'bg-amber-500/10 text-amber-500' :
                                                    notif.type === 'nft_promotion' ? 'bg-blue-500/10 text-blue-500' :
                                                    'bg-primary/10 text-primary'
                                                }`}>
                                                    {notif.type === 'withdrawal_request' ? <Settings size={14} /> : <Bell size={14} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-text truncate uppercase tracking-tight">{notif.title}</p>
                                                    <p className="text-[10px] text-muted leading-relaxed mt-0.5 line-clamp-2">{notif.message}</p>
                                                    <p className="text-[8px] text-muted/50 mt-2 font-bold uppercase tracking-widest">
                                                        {new Date(notif.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center">
                                        <Bell className="w-8 h-8 text-muted/20 mx-auto mb-2" />
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest">No active alerts</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-2 bg-surface2/30 border-t border-surface text-center">
                                <button className="text-[9px] font-bold text-muted hover:text-text uppercase tracking-widest transition-colors">
                                    Archive Center
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-5 w-px bg-surface mx-2"></div>

                <div className="relative group">
                    <button className="flex items-center gap-3 p-1 rounded-lg hover:bg-surface2 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-[10px] text-black shadow-md overflow-hidden shrink-0">
                        <Avatar src={user?.avatar} size="w-full h-full" alt="Me" />
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
                                onClick={() => setIsLogoutModalOpen(true)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors"
                            >
                                <LogOut className="w-3.5 h-3.5" /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <LogoutConfirmationModal 
                isOpen={isLogoutModalOpen} 
                onClose={() => setIsLogoutModalOpen(false)} 
                onConfirm={() => {
                    setIsLogoutModalOpen(false)
                    logout()
                    navigate('/admin/login')
                }}
            />
        </div>
    );
}

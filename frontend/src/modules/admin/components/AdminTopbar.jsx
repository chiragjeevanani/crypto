import React, { useEffect, useState, useRef, useCallback } from 'react';
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

// All searchable admin routes
const ADMIN_ROUTES = [
    { label: 'Dashboard', path: '/admin', keywords: 'home overview stats' },
    { label: 'User Management', path: '/admin/users', keywords: 'users creators accounts' },
    { label: 'KYC Management', path: '/admin/kyc', keywords: 'kyc identity verification documents' },
    { label: 'Content Control', path: '/admin/content', keywords: 'posts reels media content moderation' },
    { label: 'NFT Moderation', path: '/admin/nfts', keywords: 'nft collectibles blockchain' },
    { label: 'Campaign Management', path: '/admin/campaigns', keywords: 'campaigns brand ads mandates' },
    { label: 'Auction Management', path: '/admin/auctions', keywords: 'auctions bids listings' },
    { label: 'Wallet Overview', path: '/admin/wallet', keywords: 'wallet transactions revenue finance ledger' },
    { label: 'Financial Management', path: '/admin/financial', keywords: 'financial payouts settlements revenue' },
    { label: 'Gift Management', path: '/admin/gifts', keywords: 'gifts micro-gifts flux' },
    { label: 'Music Management', path: '/admin/music', keywords: 'music audio tracks' },
    { label: 'Reports Management', path: '/admin/reports', keywords: 'reports flagged abuse content' },
    { label: 'Location Management', path: '/admin/locations', keywords: 'locations countries regions' },
    { label: 'Security Access', path: '/admin/security', keywords: 'security access permissions roles' },
    { label: 'Fraud Monitoring', path: '/admin/fraud', keywords: 'fraud suspicious activity monitoring' },
    { label: 'Audit Logs', path: '/admin/audit-logs', keywords: 'audit logs activity history' },
    { label: 'Trending & Deals', path: '/admin/trending', keywords: 'trending deals promotions' },
    { label: 'Platform Settings', path: '/admin/settings', keywords: 'settings configuration platform' },
    { label: 'Admin Profile', path: '/admin/profile', keywords: 'profile my account' },
];

export default function AdminTopbar({ isCollapsed, setIsCollapsed, setIsMobileMenuOpen }) {
    const { darkMode, toggleDarkMode, logout, user, profile } = useUserStore();

    const { 
        adminNotifications, 
        unreadAdminNotificationsCount, 
        loadAdminNotifications, 
        readAdminNotification,
        setDashboardSearchQuery,
        dashboardStats
    } = useAdminStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
    const [isNotifOpen, setIsNotifOpen] = React.useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

    // Universal search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const searchRef = useRef(null);

    useEffect(() => {
        loadAdminNotifications();
        const timer = setInterval(loadAdminNotifications, 60000);
        return () => clearInterval(timer);
    }, [loadAdminNotifications]);

    // ⌘K / Ctrl+K focuses search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
            }
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
                setSearchQuery('');
                setDashboardSearchQuery('');
                searchRef.current?.blur();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Build combined search results: pages + users + transactions
    useEffect(() => {
        const q = searchQuery.trim().toLowerCase();
        // Always push to dashboard filter store
        setDashboardSearchQuery(q);
        if (!q) { setSearchResults([]); return; }

        // Pages
        const pageResults = ADMIN_ROUTES
            .filter(r => r.label.toLowerCase().includes(q) || r.keywords.toLowerCase().includes(q))
            .slice(0, 4)
            .map(r => ({ ...r, resultType: 'page' }));

        // Users from dashboard
        const userResults = (dashboardStats?.recentUsers || [])
            .filter(u =>
                (u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.handle || '').toLowerCase().includes(q) ||
                (u.role || '').toLowerCase().includes(q)
            )
            .slice(0, 3)
            .map(u => ({
                label: u.name || 'Unknown',
                sublabel: u.email || u.handle || '',
                badge: u.role,
                path: `/admin/users`,
                resultType: 'user'
            }));

        // Transactions from dashboard
        const txResults = (dashboardStats?.recentTransactions || [])
            .filter(tx =>
                (tx.userId?.name || '').toLowerCase().includes(q) ||
                (tx.type || '').toLowerCase().includes(q) ||
                String(tx.amount || tx.coins || '').includes(q)
            )
            .slice(0, 3)
            .map(tx => ({
                label: tx.userId?.name || 'Unknown',
                sublabel: `${tx.type} · ${tx.amount ? `₹${tx.amount}` : `${tx.coins} Coins`}`,
                path: `/admin/wallet`,
                resultType: 'transaction'
            }));

        setSearchResults([...pageResults, ...userResults, ...txResults]);
        setActiveIndex(0);
    }, [searchQuery, dashboardStats]);

    const handleSearchKeyDown = (e) => {
        if (!searchResults.length) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, searchResults.length - 1)); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter') {
            navigate(searchResults[activeIndex].path);
            setIsSearchOpen(false);
            setSearchQuery('');
        }
    };

    const handleResultClick = (path) => {
        navigate(path);
        setIsSearchOpen(false);
        setSearchQuery('');
        setDashboardSearchQuery('');
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setDashboardSearchQuery('');
        setIsSearchOpen(false);
    };

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

                {/* Breadcrumbs — sub-pages only, no root INFRA label */}
                <nav className="hidden lg:flex items-center gap-2 text-[10px] uppercase font-semibold tracking-wider text-muted">
                    {pathnames.slice(1).map((name, index) => {
                        const routeTo = `/${pathnames.slice(0, index + 2).join('/')}`;
                        return (
                            <div key={name} className="flex items-center gap-2">
                                {index > 0 && <ChevronRight className="w-3 h-3 opacity-30" />}
                                <Link to={routeTo} className="hover:text-primary transition-colors">{name}</Link>
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Global Command Search */}
            <div className="flex-1 max-w-lg mx-12 hidden md:block relative">
                <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted group-focus-within:text-primary transition-colors">
                        <Search className="w-3.5 h-3.5" />
                    </div>
                    <input
                        ref={searchRef}
                        type="text"
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                        onFocus={() => setIsSearchOpen(true)}
                        onBlur={() => setTimeout(() => setIsSearchOpen(false), 150)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Search..."
                        className="w-full bg-surface border border-surface rounded-lg py-2 pl-10 pr-12 text-[11px] font-medium focus:ring-1 focus:ring-primary/20 transition-all outline-none text-text placeholder:text-muted/50 font-[inherit]"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-bg border border-surface px-1.5 py-0.5 rounded text-[9px] font-bold text-muted pointer-events-none">
                        <Command className="w-2.5 h-2.5" /> K
                    </div>
                </div>

                {/* Search Results Dropdown */}
                {isSearchOpen && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-surface rounded-xl shadow-2xl z-50 overflow-hidden">
                        {/* Pages section */}
                        {searchResults.some(r => r.resultType === 'page') && (
                            <>
                                <div className="px-4 pt-3 pb-1">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted/60">Pages</p>
                                </div>
                                {searchResults.filter(r => r.resultType === 'page').map((result, idx) => {
                                    const globalIdx = searchResults.indexOf(result);
                                    return (
                                        <button
                                            key={result.path + idx}
                                            onMouseDown={() => handleResultClick(result.path)}
                                            onMouseEnter={() => setActiveIndex(globalIdx)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                                globalIdx === activeIndex ? 'bg-primary/10 text-primary' : 'hover:bg-surface2 text-text'
                                            }`}
                                        >
                                            <Search className="w-3 h-3 shrink-0 opacity-40" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold uppercase tracking-wide truncate">{result.label}</p>
                                                <p className="text-[9px] text-muted font-medium truncate">{result.path}</p>
                                            </div>
                                            <ChevronRight className="w-3 h-3 opacity-30 shrink-0" />
                                        </button>
                                    );
                                })}
                            </>
                        )}

                        {/* Users section */}
                        {searchResults.some(r => r.resultType === 'user') && (
                            <>
                                <div className="px-4 pt-3 pb-1 border-t border-surface mt-1">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted/60">Users</p>
                                </div>
                                {searchResults.filter(r => r.resultType === 'user').map((result, idx) => {
                                    const globalIdx = searchResults.indexOf(result);
                                    return (
                                        <button
                                            key={'user-' + idx}
                                            onMouseDown={() => handleResultClick(result.path)}
                                            onMouseEnter={() => setActiveIndex(globalIdx)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                                globalIdx === activeIndex ? 'bg-primary/10 text-primary' : 'hover:bg-surface2 text-text'
                                            }`}
                                        >
                                            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                                <span className="text-[8px] font-black text-blue-500">{(result.label[0] || '?').toUpperCase()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold truncate">{result.label}</p>
                                                <p className="text-[9px] text-muted font-medium uppercase tracking-wider truncate">{result.sublabel}</p>
                                            </div>
                                            {result.badge && (
                                                <span className="text-[8px] font-bold text-muted uppercase bg-surface2 border border-surface px-1.5 py-0.5 rounded shrink-0">{result.badge}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </>
                        )}

                        {/* Transactions section */}
                        {searchResults.some(r => r.resultType === 'transaction') && (
                            <>
                                <div className="px-4 pt-3 pb-1 border-t border-surface mt-1">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted/60">Transactions</p>
                                </div>
                                {searchResults.filter(r => r.resultType === 'transaction').map((result, idx) => {
                                    const globalIdx = searchResults.indexOf(result);
                                    return (
                                        <button
                                            key={'tx-' + idx}
                                            onMouseDown={() => handleResultClick(result.path)}
                                            onMouseEnter={() => setActiveIndex(globalIdx)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                                globalIdx === activeIndex ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-surface2 text-text'
                                            }`}
                                        >
                                            <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                <span className="text-[8px] font-black text-emerald-500">₹</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold truncate">{result.label}</p>
                                                <p className="text-[9px] text-muted font-medium uppercase tracking-wider truncate">{result.sublabel}</p>
                                            </div>
                                            <ChevronRight className="w-3 h-3 opacity-30 shrink-0" />
                                        </button>
                                    );
                                })}
                            </>
                        )}

                        <div className="px-4 py-2 border-t border-surface bg-bg/50">
                            <p className="text-[8px] text-muted/50 font-bold uppercase tracking-widest">
                                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} · Press ↵ to open
                            </p>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {isSearchOpen && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-surface rounded-xl shadow-2xl z-50 p-4 text-center">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">No results for "{searchQuery}"</p>
                    </div>
                )}
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
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        onBlur={() => setTimeout(() => setIsNotifOpen(false), 200)}
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
                    <div className={`absolute right-0 top-full pt-2 transition-all duration-200 transform origin-top-right z-50 ${isNotifOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-1 lg:group-hover/notif:opacity-100 lg:group-hover/notif:visible lg:group-hover/notif:translate-y-0'}`}>
                        <div className="w-[300px] sm:w-80 bg-surface border border-surface rounded-xl shadow-2xl overflow-hidden">
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
                    <button 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        onBlur={() => setTimeout(() => setIsUserMenuOpen(false), 200)}
                        className="flex items-center gap-3 p-1 rounded-lg hover:bg-surface2 transition-all"
                    >
                        <div className="w-8 h-8 rounded-lg bg-surface2 border border-surface flex items-center justify-center font-bold text-[10px] text-text shadow-md overflow-hidden shrink-0">
                            {user?.avatar ? (
                                <img src={user.avatar} className="w-full h-full object-cover" alt="Admin" />
                            ) : (
                                <User className="w-4 h-4 opacity-50" />
                            )}
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
                    <div className={`absolute right-0 top-full pt-2 transition-all duration-200 transform origin-top-right z-50 ${isUserMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-1 lg:group-hover:opacity-100 lg:group-hover:visible lg:group-hover:translate-y-0'}`}>
                        <div className="w-52 bg-surface border border-surface rounded-lg shadow-2xl p-2">
                            <div className="px-3 py-2 mb-2 border-b border-surface pb-3">
                                <p className="text-[10px] font-bold text-text uppercase tracking-wider truncate">{user?.name || getRoleLabel(user?.role)}</p>
                                <p className="text-[8px] text-muted font-medium mt-0.5 uppercase tracking-wider truncate">{user?.email || '—'}</p>
                                <p className="text-[8px] text-muted/80 mt-0.5">{getRoleHandle(user, profile)} · {getRoleLabel(user?.role)}</p>
                            </div>
                            <Link to="/admin/profile" className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider hover:bg-primary/5 hover:text-primary rounded-md transition-colors text-text group/item">
                                <User className="w-3.5 h-3.5" /> My Profile
                            </Link>
                            <Link to="/admin/settings" className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider hover:bg-primary/5 hover:text-primary rounded-md transition-colors text-text group/item">
                                <Settings className="w-3.5 h-3.5" /> Parameters
                            </Link>
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
                onConfirm={async () => {
                    setIsLogoutModalOpen(false)
                    logout()
                    navigate('/admin/login')
                }}
            />
        </div>
    );
}

import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Megaphone, Plus, Wallet, User, PlayCircle } from 'lucide-react'

const navItems = [
    { to: '/home', icon: Home, label: 'Home', key: 'home' },
    { to: '/home?view=reels', icon: PlayCircle, label: 'Reels', key: 'reels' },
    { to: '/tasks', icon: Megaphone, label: 'Campaigns', key: 'tasks' },
    { to: '/create', icon: Plus, label: 'Create', isCreate: true, key: 'create' },
    { to: '/wallet', icon: Wallet, label: 'Wallet', key: 'wallet' },
    { to: '/profile', icon: User, label: 'Profile', key: 'profile' },
]

export default function BottomNavbar() {
    const location = useLocation()
    const navigate = useNavigate()
    const searchParams = new URLSearchParams(location.search)
    const view = searchParams.get('view')

    const isHomeActive = location.pathname === '/home' && !view
    const isReelsActive = location.pathname === '/home' && view === 'reels'

    const isItemActive = (item) => {
        if (item.key === 'home') return isHomeActive
        if (item.key === 'reels') return isReelsActive
        return location.pathname === item.to
    }

    const handleNavigate = (to) => {
        navigate(to)
    }

    return (
        <nav
            className="bottom-navbar fixed inset-x-0 bottom-0 z-[70] flex items-center justify-around px-2 lg:justify-start lg:gap-2 lg:px-4"
            style={{
                height: 'var(--bottom-nav-height)',
                paddingBottom: 'var(--safe-area-bottom)',
                background: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)',
            }}
        >
            {navItems.map((item) => {
                const Icon = item.icon
                const active = isItemActive(item)

                if (item.isCreate) {
                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => handleNavigate(item.to)}
                            className="flex flex-col items-center lg:flex-none"
                        >
                            <motion.div
                                whileTap={{ scale: 0.88 }}
                                className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg cursor-pointer lg:w-auto lg:h-10 lg:rounded-lg lg:px-3 lg:gap-2"
                                style={{
                                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))',
                                    boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
                                }}
                            >
                                <Icon size={22} color="#fff" strokeWidth={2.5} />
                                <span className="hidden lg:block text-sm font-semibold text-white">{item.label}</span>
                            </motion.div>
                        </button>
                    )
                }

                return (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => handleNavigate(item.to)}
                        className="flex flex-col items-center gap-0.5 flex-1 py-1 cursor-pointer lg:flex-none lg:py-0 relative"
                    >
                        <div
                            className="flex flex-col items-center gap-0.5 lg:flex-row lg:justify-start lg:gap-2 lg:px-3 lg:py-2 lg:rounded-lg"
                            style={active ? { background: 'rgba(245, 158, 11, 0.12)' } : undefined}
                        >
                            <motion.div whileTap={{ scale: 0.85 }}>
                                <Icon
                                    size={22}
                                    strokeWidth={active ? 2.5 : 1.8}
                                    style={{ color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}
                                />
                            </motion.div>
                            <span
                                className="text-[10px] font-medium lg:text-sm"
                                style={{ color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}
                            >
                                {item.label}
                            </span>
                            {active && (
                                <motion.div
                                    layoutId="tab-indicator"
                                    className="absolute top-0 h-0.5 w-6 rounded-full lg:hidden"
                                    style={{ background: 'var(--color-primary)' }}
                                />
                            )}
                        </div>
                    </button>
                )
            })}
        </nav>
    )
}

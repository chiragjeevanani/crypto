import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ListChecks, Plus, Wallet, User } from 'lucide-react'

const navItems = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/tasks', icon: ListChecks, label: 'Tasks' },
    { to: '/create', icon: Plus, label: 'Create', isCreate: true },
    { to: '/wallet', icon: Wallet, label: 'Wallet' },
    { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNavbar() {
    return (
        <nav
            className="relative flex-shrink-0 flex items-center justify-around px-2"
            style={{
                height: 'var(--bottom-nav-height)',
                paddingBottom: 'var(--safe-area-bottom)',
                background: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)',
            }}
        >
            {navItems.map((item) => {
                const Icon = item.icon

                if (item.isCreate) {
                    return (
                        <NavLink key={item.to} to={item.to} className="flex flex-col items-center">
                            {({ isActive }) => (
                                <motion.div
                                    whileTap={{ scale: 0.88 }}
                                    className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg cursor-pointer"
                                    style={{
                                        background: isActive
                                            ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))'
                                            : 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))',
                                        boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
                                    }}
                                >
                                    <Icon size={22} color="#fff" strokeWidth={2.5} />
                                </motion.div>
                            )}
                        </NavLink>
                    )
                }

                return (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className="flex flex-col items-center gap-0.5 flex-1 py-1 cursor-pointer"
                    >
                        {({ isActive }) => (
                            <div className="flex flex-col items-center gap-0.5">
                                <motion.div whileTap={{ scale: 0.85 }}>
                                    <Icon
                                        size={22}
                                        strokeWidth={isActive ? 2.5 : 1.8}
                                        style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-muted)' }}
                                    />
                                </motion.div>
                                <span
                                    className="text-[10px] font-medium"
                                    style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-muted)' }}
                                >
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="tab-indicator"
                                        className="absolute top-0 h-0.5 w-6 rounded-full"
                                        style={{ background: 'var(--color-primary)' }}
                                    />
                                )}
                            </div>
                        )}
                    </NavLink>
                )
            })}
        </nav>
    )
}

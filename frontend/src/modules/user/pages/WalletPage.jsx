import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, CheckSquare, Gem, TrendingUp, Link, ArrowDownLeft } from 'lucide-react'
import { useWalletStore } from '../store/useWalletStore'
import WalletStatCard from '../components/wallet/WalletStatCard'
import TransactionItem from '../components/wallet/TransactionItem'
import { weeklyEarnings } from '../data/mockTransactions'

const TABS = ['Transactions', 'Withdraw', 'Linked']
const MAX_WEEKLY = Math.max(...weeklyEarnings.map((d) => d.amount))
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

export default function WalletPage() {
    const { balance, giftEarnings, taskEarnings, nftEarnings, transactions } = useWalletStore()
    const [activeTab, setActiveTab] = useState('Transactions')

    return (
        <div className="px-4 pt-4">
            {/* Header */}
            <h1 className="text-xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>Wallet</h1>

            {/* Balance hero */}
            <div
                className="rounded-2xl p-5 mb-4 text-center"
                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(249,115,22,0.08))', border: '1px solid rgba(245,158,11,0.2)' }}
            >
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--color-primary)' }}>
                    Total Balance
                </p>
                <AnimatePresence mode="popLayout">
                    <motion.p
                        key={balance}
                        className="text-4xl font-extrabold"
                        style={{ color: 'var(--color-text)', letterSpacing: '-0.02em' }}
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        ₹{balance.toLocaleString()}
                    </motion.p>
                </AnimatePresence>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                    Available for withdrawal
                </p>
            </div>

            {/* Earnings breakdown */}
            <div className="flex gap-2 mb-4">
                <WalletStatCard label="Gifts" amount={giftEarnings} icon={Gift} color="var(--color-danger)" small />
                <WalletStatCard label="Tasks" amount={taskEarnings} icon={CheckSquare} color="var(--color-primary)" small />
                <WalletStatCard label="NFTs" amount={nftEarnings} icon={Gem} color="var(--color-purple)" small />
            </div>

            {/* Weekly bar chart */}
            <div
                className="rounded-2xl p-4 mb-4"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-muted)' }}>This Week</p>
                <div className="flex items-end gap-2 h-16">
                    {weeklyEarnings.map((d, i) => {
                        const pct = (d.amount / MAX_WEEKLY) * 100
                        const isToday = i === TODAY_IDX
                        return (
                            <div key={d.day} className="flex flex-col items-center gap-1 flex-1">
                                <div className="w-full rounded-t-sm" style={{
                                    height: `${pct}%`,
                                    minHeight: 4,
                                    background: isToday ? 'var(--color-primary)' : 'var(--color-surface2)',
                                    transition: 'all 0.3s',
                                }} />
                                <span className="text-[10px]" style={{ color: isToday ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                                    {d.day}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-3" style={{ borderColor: 'var(--color-border)' }}>
                {TABS.map((tab) => {
                    const active = tab === activeTab
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="flex-1 pb-2.5 text-sm font-semibold cursor-pointer transition-colors duration-150 relative"
                            style={{ color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}
                        >
                            {tab}
                            {active && (
                                <motion.div
                                    layoutId="wallet-tab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                    style={{ background: 'var(--color-primary)' }}
                                />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {activeTab === 'Transactions' && (
                        <div>
                            {transactions.map((tx) => (
                                <TransactionItem key={tx.id} tx={tx} />
                            ))}
                        </div>
                    )}

                    {activeTab === 'Withdraw' && (
                        <div className="flex flex-col gap-4 py-2">
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sub)' }}>
                                    Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    placeholder="Min. ₹100"
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sub)' }}>
                                    Withdraw to
                                </label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none cursor-pointer"
                                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                >
                                    <option>UPI — 9876543210@upi</option>
                                    <option>Bank — SBI ···1234</option>
                                </select>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                className="w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))', color: '#fff' }}
                            >
                                Withdraw Now
                            </motion.button>
                        </div>
                    )}

                    {activeTab === 'Linked' && (
                        <div className="flex flex-col gap-3 py-2">
                            {[
                                { name: 'UPI', detail: '9876543210@upi', primary: true },
                                { name: 'SBI Bank', detail: 'Account ···1234', primary: false },
                            ].map((acc, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-4 rounded-2xl"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                >
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-surface2)' }}>
                                        <Link size={18} style={{ color: 'var(--color-primary)' }} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{acc.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{acc.detail}</p>
                                    </div>
                                    {acc.primary && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                            style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-success)' }}>
                                            Primary
                                        </span>
                                    )}
                                </div>
                            ))}
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer mt-2"
                                style={{ background: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}
                            >
                                + Add Account
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

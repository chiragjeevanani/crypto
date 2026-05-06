import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, X } from 'lucide-react'

export default function LogoutConfirmationModal({ isOpen, onClose, onConfirm }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-[340px] overflow-hidden rounded-3xl p-6 shadow-2xl"
                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-[var(--color-surface2)] transition-colors"
                        >
                            <X size={18} style={{ color: 'var(--color-muted)' }} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            {/* Icon Wrapper */}
                            <div 
                                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                                style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.2)' }}
                            >
                                <LogOut size={28} className="text-rose-500" />
                            </div>

                            <h3 className="mb-2 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                                Logout?
                            </h3>
                            <p className="mb-8 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                                Are you sure you want to log out of your account? You'll need to sign in again to access your wallet and reels.
                            </p>

                            <div className="flex w-full flex-col gap-3">
                                <button
                                    onClick={onConfirm}
                                    className="w-full rounded-2xl py-3.5 text-sm font-bold shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    style={{ background: 'linear-gradient(135deg, #f43f5e, #fb7185)', color: 'white' }}
                                >
                                    Yes, Log Out
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full rounded-2xl py-3.5 text-sm font-bold transition-all hover:bg-[var(--color-surface2)] active:scale-[0.98]"
                                    style={{ background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

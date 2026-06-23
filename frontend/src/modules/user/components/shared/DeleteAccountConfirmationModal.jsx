import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, X } from 'lucide-react'

export default function DeleteAccountConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm,
    password,
    setPassword,
    error,
    isDeleting 
}) {
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
                                style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                            >
                                <Trash2 size={28} className="text-red-500" />
                            </div>

                            <h3 className="mb-2 text-xl font-bold text-red-500">
                                Delete Account?
                            </h3>
                            <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                                Are you absolutely sure you want to delete your account? This action cannot be undone and you will lose all your data, posts, and wallet balance.
                            </p>

                            <div className="w-full mb-6">
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password to confirm"
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                    style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                                    disabled={isDeleting}
                                />
                                {error && <p className="mt-2 text-xs font-semibold text-red-500 text-left">{error}</p>}
                            </div>

                            <div className="flex w-full flex-col gap-3">
                                <button
                                    onClick={onConfirm}
                                    disabled={isDeleting}
                                    className="w-full rounded-2xl py-3.5 text-sm font-bold shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                                    style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)', color: 'white' }}
                                >
                                    {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
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

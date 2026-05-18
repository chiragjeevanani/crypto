import { motion, AnimatePresence } from 'framer-motion'

export default function BottomModal({ isOpen, onClose, title, children, maxHeight = '85vh' }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        className="relative w-full max-w-[430px] mx-auto bg-[var(--color-bg)] rounded-t-[32px] overflow-hidden flex flex-col"
                        style={{ maxHeight }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center py-3">
                            <div className="w-10 h-1.5 rounded-full" style={{ background: 'var(--color-surface2)' }} />
                        </div>

                        {/* Optional Title Header */}
                        {title && (
                            <div className="px-6 pb-2">
                                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{title}</h3>
                            </div>
                        )}

                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

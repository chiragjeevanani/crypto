import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'

export default function FullPageSlide({ isOpen, onClose, title, children }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[60] flex flex-col w-full max-w-[430px] mx-auto"
                    style={{ background: 'var(--color-bg)' }}
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center gap-2 px-4 py-4"
                        style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                        <button
                            onClick={onClose}
                            className="p-2 -ml-2 rounded-full cursor-pointer hover:bg-zinc-800/50 transition-colors"
                        >
                            <ChevronLeft size={24} style={{ color: 'var(--color-text)' }} />
                        </button>
                        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{title}</h3>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto hide-scrollbar pb-safe">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

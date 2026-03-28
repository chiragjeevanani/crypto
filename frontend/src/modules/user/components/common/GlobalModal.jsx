import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react'
import { useModalStore } from '../../store/useModalStore'

const ICONS = {
    info: <Info className="text-blue-500" size={24} />,
    success: <CheckCircle2 className="text-emerald-500" size={24} />,
    warning: <AlertCircle className="text-amber-500" size={24} />,
    error: <XCircle className="text-rose-500" size={24} />
}

const COLORS = {
    info: 'border-blue-500/20 bg-blue-500/5',
    success: 'border-emerald-500/20 bg-emerald-500/5',
    warning: 'border-amber-500/20 bg-amber-500/5',
    error: 'border-rose-500/20 bg-rose-500/5'
}

export default function GlobalModal() {
    const { isOpen, title, message, type, closeModal, onConfirm } = useModalStore()

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`relative w-full max-w-sm rounded-[32px] border p-6 shadow-2xl bg-surface ${COLORS[type] || COLORS.info}`}
                    >
                        <button 
                            onClick={closeModal}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-muted transition-all"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                                {ICONS[type] || ICONS.info}
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-base font-black uppercase tracking-widest text-text">
                                    {title || 'Notification'}
                                </h3>
                                <p className="text-xs font-medium leading-relaxed text-muted whitespace-pre-wrap">
                                    {message}
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    if (onConfirm) onConfirm();
                                    closeModal();
                                }}
                                className="w-full mt-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 bg-primary text-black"
                            >
                                {onConfirm ? 'Confirm Action' : 'Dismiss'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

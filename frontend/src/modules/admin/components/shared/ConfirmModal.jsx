import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2, ShieldAlert, CheckCircle, X } from 'lucide-react'

const ICONS = {
    danger: Trash2,
    warning: AlertTriangle,
    secure: ShieldAlert,
    success: CheckCircle,
}

const COLORS = {
    danger:  { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  btn: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
    warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', btn: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
    secure:  { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.25)', btn: '#6366f1', glow: 'rgba(99,102,241,0.3)' },
    success: { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  btn: '#22c55e', glow: 'rgba(34,197,94,0.3)' },
}

/**
 * ConfirmModal – replaces browser confirm() everywhere in the admin panel.
 *
 * Props:
 *   isOpen      boolean   – controls visibility
 *   onConfirm   () => void
 *   onCancel    () => void
 *   title       string    – modal headline
 *   message     string    – body copy
 *   confirmText string    – confirm button label  (default: "Confirm")
 *   cancelText  string    – cancel  button label  (default: "Cancel")
 *   variant     'danger' | 'warning' | 'secure' | 'success'  (default: 'danger')
 */
export default function ConfirmModal({
    isOpen,
    onConfirm,
    onCancel,
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
}) {
    const color = COLORS[variant] || COLORS.danger
    const Icon  = ICONS[variant]  || ICONS.danger

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="confirm-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1,    y: 0  }}
                        exit={{   opacity: 0, scale: 0.92, y: 16  }}
                        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                        className="relative w-full max-w-sm rounded-3xl p-7 shadow-2xl"
                        style={{
                            background: 'var(--color-surface, #1a1a2e)',
                            border: `1px solid ${color.border}`,
                            boxShadow: `0 0 60px ${color.glow}`,
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close (X) */}
                        <button
                            onClick={onCancel}
                            className="absolute top-4 right-4 p-1.5 rounded-full opacity-40 hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--color-muted)' }}
                        >
                            <X size={16} />
                        </button>

                        {/* Icon badge */}
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                            style={{ background: color.bg, border: `1.5px solid ${color.border}` }}
                        >
                            <Icon size={26} style={{ color: color.btn }} />
                        </div>

                        {/* Text */}
                        <h3 className="text-base font-black tracking-tight mb-2" style={{ color: 'var(--color-text)' }}>
                            {title}
                        </h3>
                        <p className="text-[12px] font-medium leading-relaxed mb-7" style={{ color: 'var(--color-muted)' }}>
                            {message}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:opacity-80 active:scale-95"
                                style={{
                                    background: 'var(--color-surface2, #252540)',
                                    color: 'var(--color-muted)',
                                    border: '1px solid var(--color-border)',
                                }}
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all hover:brightness-110 active:scale-95"
                                style={{
                                    background: color.btn,
                                    boxShadow: `0 8px 24px ${color.glow}`,
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

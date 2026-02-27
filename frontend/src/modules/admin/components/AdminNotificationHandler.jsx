import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info, Loader2 } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export default function AdminNotificationHandler() {
    const { lastSharedAction, clearNotification, isLoading } = useAdminStore();
    const [visibleAction, setVisibleAction] = useState(null);

    useEffect(() => {
        if (lastSharedAction) {
            setVisibleAction(lastSharedAction);
            const timer = setTimeout(() => {
                setVisibleAction(null);
                clearNotification();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [lastSharedAction, clearNotification]);

    return (
        <>
            {/* Global Loading Overlay (Subtle) */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed top-20 right-8 z-[60] py-2 px-4 bg-surface/80 backdrop-blur-md border border-surface shadow-2xl rounded-full flex items-center gap-3"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                            <Loader2 className="w-4 h-4 text-primary" />
                        </motion.div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text">Syncing with Node...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notification Toast */}
            <AnimatePresence>
                {visibleAction && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, y: 0 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        className="fixed bottom-8 right-8 z-[100] max-w-sm w-full"
                    >
                        <div className={`p-4 rounded-xl border shadow-2xl backdrop-blur-xl ${visibleAction.type === 'success'
                                ? 'bg-bg/90 border-emerald-500/20 shadow-emerald-500/5'
                                : 'bg-bg/90 border-rose-500/20 shadow-rose-500/5'
                            }`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${visibleAction.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                    }`}>
                                    {visibleAction.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-xs font-bold uppercase tracking-widest ${visibleAction.type === 'success' ? 'text-emerald-500' : 'text-rose-500'
                                        }`}>
                                        {visibleAction.type === 'success' ? 'Registry Success' : 'Protocol Error'}
                                    </h4>
                                    <p className="text-[11px] font-medium text-text mt-1 leading-relaxed">
                                        {visibleAction.message}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setVisibleAction(null)}
                                    className="p-1 hover:bg-surface rounded-md transition-colors text-muted"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Progress bar for auto-close */}
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className={`h-0.5 absolute bottom-0 left-0 rounded-b-xl ${visibleAction.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

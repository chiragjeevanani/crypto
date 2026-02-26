import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function AdminStatCard({ label, value, change, icon: Icon, color = 'primary', delay = 0, path }) {
    const CardContent = (
        <div className="relative z-10 w-full h-full">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-lg bg-${color}/5 text-${color} border border-${color}/10 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="w-5 h-5" />
                </div>
                {change && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${change.startsWith('+')
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : change.includes('%') ? 'bg-indigo-500/10 text-indigo-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                        {change}
                    </span>
                )}
            </div>
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1 opacity-60">{label}</p>
                <p className="text-xl font-bold text-text tracking-tight">{value}</p>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            className={`bg-surface border border-surface p-5 rounded-lg relative overflow-hidden group hover:border-primary/20 transition-all shadow-sm ${path ? 'cursor-pointer' : ''}`}
        >
            {path ? (
                <Link to={path} className="block w-full h-full">
                    {CardContent}
                </Link>
            ) : CardContent}

            {/* Subtle background decoration */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 bg-${color}/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
        </motion.div>
    );
}

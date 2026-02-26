import { Users, Clock, Trophy, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCount, daysLeft } from '../../utils/formatCurrency'

const BRAND_COLORS = {
    Swiggy: '#FC8019', Myntra: '#FF3F6C', BoAt: '#E63946',
    Nykaa: '#FC2779', Meesho: '#9B51E0',
}

export default function TaskCard({ task, onClick }) {
    const brandColor = BRAND_COLORS[task.brand.name] || '#f59e0b'
    const deadlineText = daysLeft(task.deadline)
    const isEnding = new Date(task.deadline) - Date.now() < 3 * 86400000

    return (
        <motion.article
            whileTap={{ scale: 0.985 }}
            onClick={onClick}
            className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer mb-3 transition-colors duration-150"
            style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
            }}
        >
            {/* Brand logo */}
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                style={{ background: brandColor }}
            >
                {task.brand.name.charAt(0)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold mb-0.5" style={{ color: brandColor }}>
                            {task.brand.name}
                        </p>
                        <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>
                            {task.title}
                        </p>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--color-muted)', flexShrink: 0, marginTop: 2 }} />
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--color-primary)' }}
                    >
                        <Trophy size={10} strokeWidth={2.5} />
                        ₹{task.rewardPool.toLocaleString()} pool
                    </span>

                    <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                            background: isEnding ? 'rgba(244,63,94,0.12)' : 'rgba(113,113,122,0.12)',
                            color: isEnding ? 'var(--color-danger)' : 'var(--color-muted)',
                        }}
                    >
                        <Clock size={10} strokeWidth={2.5} />
                        {deadlineText}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-muted)' }}>
                        <Users size={10} strokeWidth={2} />
                        {formatCount(task.participants)} joined
                    </span>
                </div>

                {/* Steps dots */}
                <div className="flex items-center gap-1.5 mt-2">
                    {task.steps.map((step, i) => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{ background: task.joined && i === 0 ? 'var(--color-success)' : 'var(--color-surface2)' }}
                        />
                    ))}
                    <span className="text-[10px] ml-1" style={{ color: 'var(--color-muted)' }}>
                        {task.steps.length} steps
                    </span>
                    {task.joined && (
                        <span
                            className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--color-success)' }}
                        >
                            Joined
                        </span>
                    )}
                </div>
            </div>
        </motion.article>
    )
}

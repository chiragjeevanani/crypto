import { cn } from '../../utils/cn'

export default function WalletStatCard({ label, amount, icon: Icon, color, small, currencySymbol = '₹' }) {
    return (
        <div
            className={cn(
                'rounded-[20px] p-4 flex flex-col gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]',
                small ? 'flex-1' : ''
            )}
            style={{ 
                background: 'var(--color-surface)', 
                border: '1px solid var(--color-border)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
        >
            <div className="flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}15` }}
                >
                    <Icon size={14} style={{ color }} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
                    {label}
                </span>
            </div>
            <p className="text-lg font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
                {currencySymbol}{amount.toLocaleString()}
            </p>
        </div>
    )
}

import { cn } from '../../utils/cn'

export default function WalletStatCard({ label, amount, icon: Icon, color, small }) {
    return (
        <div
            className={cn(
                'rounded-2xl p-3 flex flex-col gap-1',
                small ? 'flex-1' : ''
            )}
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
            <div className="flex items-center gap-1.5">
                <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: `${color}20` }}
                >
                    <Icon size={13} style={{ color }} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-medium" style={{ color: 'var(--color-muted)' }}>
                    {label}
                </span>
            </div>
            <p className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                ₹{amount.toLocaleString()}
            </p>
        </div>
    )
}

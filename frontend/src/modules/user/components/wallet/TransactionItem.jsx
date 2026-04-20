import { Gift, CheckSquare, Gem, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { timeAgo } from '../../utils/formatCurrency'

const TYPE_META = {
    gift: { icon: Gift, color: 'var(--color-danger)', label: 'Gift' },
    gift_sent: { icon: ArrowUpRight, color: 'var(--color-primary)', label: 'Gift Sent' },
    task: { icon: CheckSquare, color: 'var(--color-primary)', label: 'Task' },
    nft: { icon: Gem, color: 'var(--color-purple)', label: 'NFT' },
    nft_buy: { icon: ArrowUpRight, color: 'var(--color-primary)', label: 'NFT Buy' },
    withdraw: { icon: ArrowUpRight, color: 'var(--color-muted)', label: 'Withdraw' },
    topup: { icon: ArrowDownLeft, color: 'var(--color-success)', label: 'Top Up' },
    transfer: { icon: ArrowUpRight, color: 'var(--color-muted)', label: 'Transfer' },
}

export default function TransactionItem({ tx, currencySymbol = '₹' }) {
    const meta = TYPE_META[tx.type] || TYPE_META.gift
    const Icon = meta.icon
    const isCredit = tx.amount > 0

    return (
        <div className="flex items-center gap-4 py-4 group" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div
                className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                style={{ background: `${meta.color}15` }}
            >
                <Icon size={16} style={{ color: meta.color }} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
                    {tx.title}
                </p>
                <p className="text-[10px] font-bold mt-0.5 opacity-60 uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    {meta.label} · {timeAgo(tx.date)}
                </p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
                <span
                    className="text-sm font-black"
                    style={{ color: isCredit ? 'var(--color-success)' : 'var(--color-danger)' }}
                >
                    {isCredit ? '+' : ''}{currencySymbol}{Math.abs(tx.amount).toLocaleString()}
                </span>
                <span className="text-[8px] font-black uppercase tracking-tighter opacity-40">
                    {tx.status}
                </span>
            </div>
        </div>
    )
}

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

export default function TransactionItem({ tx }) {
    const meta = TYPE_META[tx.type] || TYPE_META.gift
    const Icon = meta.icon
    const isCredit = tx.amount > 0

    return (
        <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${meta.color}18` }}
            >
                <Icon size={16} style={{ color: meta.color }} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                    {tx.title}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                    {meta.label} · {timeAgo(tx.date)} · {tx.status}
                </p>
            </div>
            <span
                className="text-sm font-bold flex-shrink-0"
                style={{ color: isCredit ? 'var(--color-success)' : 'var(--color-danger)' }}
            >
                {isCredit ? '+' : ''}₹{Math.abs(tx.amount)}
            </span>
        </div>
    )
}

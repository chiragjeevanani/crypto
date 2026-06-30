import { useState } from 'react'
import { Gift, CheckSquare, Gem, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { timeAgo } from '../../utils/formatCurrency'

const TYPE_META = {
    gift: { icon: Gift, color: 'var(--color-danger)', label: 'Gift Received' },
    gift_sent: { icon: ArrowUpRight, color: 'var(--color-primary)', label: 'Gift Sent' },
    task: { icon: CheckSquare, color: 'var(--color-primary)', label: 'Task' },
    nft: { icon: Gem, color: 'var(--color-purple)', label: 'NFT' },
    nft_buy: { icon: ArrowUpRight, color: 'var(--color-primary)', label: 'NFT Buy' },
    withdraw: { icon: ArrowUpRight, color: '#FF9933', label: 'Withdraw' },
    topup: { icon: ArrowDownLeft, color: 'var(--color-success)', label: 'Top Up' },
    transfer: { icon: ArrowUpRight, color: 'var(--color-muted)', label: 'Transfer' },
}

export default function TransactionItem({ tx, currencySymbol = '₹' }) {
    const [showReason, setShowReason] = useState(false)
    const meta = TYPE_META[tx.type] || TYPE_META.gift
    const Icon = meta.icon
    const isCredit = tx.amount > 0

    // Use localized amount from backend if available, otherwise use INR coins amount
    const hasLocalAmount = tx.localAmount !== null && tx.localAmount !== undefined && tx.localSymbol
    const displaySymbol = hasLocalAmount ? tx.localSymbol : currencySymbol
    const displayAmount = hasLocalAmount ? tx.localAmount : tx.amount

    // Format: large amounts show 2 decimals, small amounts show 4
    const formattedAmount = hasLocalAmount
        ? Math.abs(displayAmount) >= 1
            ? Math.abs(displayAmount).toFixed(2)
            : Math.abs(displayAmount).toFixed(4)
        : Math.abs(displayAmount).toLocaleString()

    const hasRejection = tx.status === 'failed' || tx.status === 'rejected'
    const rejectionReason = tx.meta?.rejectionReason || "Request rejected by administrator. Please check your bank details or contact support."

    return (
        <div 
            onClick={() => {
                if (hasRejection) setShowReason(!showReason)
            }}
            className={`flex flex-col py-4 group transition-colors ${hasRejection ? 'cursor-pointer hover:bg-surface/30 px-2 rounded-2xl -mx-2' : ''}`}
            style={{ borderBottom: '1px solid var(--color-border)' }}
        >
            <div className="flex items-center gap-4 w-full">
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
                <div className="flex flex-col items-end gap-0.5 pr-2">
                    <span
                        className="text-sm font-black"
                        style={{ color: isCredit ? 'var(--color-success)' : 'var(--color-danger)' }}
                    >
                        {isCredit ? '+' : '-'}{displaySymbol}{formattedAmount}
                    </span>
                    {/* Show currency code badge for non-INR transactions */}
                    {hasLocalAmount && tx.localCurrency && tx.localCurrency !== 'INR' && (
                        <span className="text-[7px] font-black uppercase tracking-widest opacity-50 px-1.5 py-0.5 rounded-full border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                            {tx.localCurrency}
                        </span>
                    )}
                    <span className={`text-[8px] font-black uppercase tracking-tighter ${hasRejection ? 'text-red-500 underline decoration-dotted' : 'opacity-40'}`}>
                        {tx.status} {hasRejection && '(View Reason)'}
                    </span>
                </div>
            </div>
            {hasRejection && showReason && (
                <div className="mt-3 ml-14 mr-2 p-4 rounded-[18px] bg-red-500/5 border border-red-500/20 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-[9px] font-black uppercase text-red-500 mb-1 tracking-widest">Rejection Reason</p>
                    <p className="text-xs font-bold leading-normal" style={{ color: 'var(--color-text)' }}>{rejectionReason}</p>
                </div>
            )}
        </div>
    )
}

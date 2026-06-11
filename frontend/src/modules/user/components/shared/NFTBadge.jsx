import { Gem } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useUserCurrency } from '../../utils/formatCurrency'

export default function NFTBadge({ status = 'listed', price, className }) {
    const { format } = useUserCurrency()
    const statusMap = {
        listed: { label: 'NFT Listed', color: 'var(--color-purple)' },
        sold: { label: 'NFT Sold', color: 'var(--color-success)' },
    }
    const { label, color } = statusMap[status] || statusMap.listed

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                className
            )}
            style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
        >
            <Gem size={10} strokeWidth={2.5} />
            {label}
            {price !== undefined && price !== null && ` · ${format(price)}`}
        </span>
    )
}

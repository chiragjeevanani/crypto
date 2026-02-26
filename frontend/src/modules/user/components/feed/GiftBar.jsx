import { Gift } from 'lucide-react'
import GiftButton from './GiftButton'
import { giftTypes } from '../../data/mockPosts'

export default function GiftBar({ postId, onGift }) {
    return (
        <div className="flex items-center gap-3">
            <Gift size={18} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                {giftTypes.map((gift) => (
                    <GiftButton
                        key={gift.id}
                        gift={gift}
                        onGift={onGift}
                    />
                ))}
            </div>
        </div>
    )
}

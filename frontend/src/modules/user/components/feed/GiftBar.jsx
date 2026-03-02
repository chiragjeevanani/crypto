import { useEffect, useRef, useState } from 'react'
import { Gift } from 'lucide-react'
import GiftButton from './GiftButton'
import { usePlatformSettings } from '../../hooks/usePlatformSettings'
import { useWalletStore } from '../../store/useWalletStore'
import { getActiveGiftCatalog } from '../../../../shared/giftCatalog'

export default function GiftBar({ postId, onGift }) {
    const { maxGiftsPerMinute } = usePlatformSettings()
    const { giftSpendWallet, setGiftSpendWallet, inrWallet, cryptoWallet } = useWalletStore()
    const [giftTypes, setGiftTypes] = useState(() => getActiveGiftCatalog())
    const sentAtRef = useRef([])

    useEffect(() => {
        const sync = () => setGiftTypes(getActiveGiftCatalog())
        const onStorage = (event) => {
            if (event.key === 'socialearn_gift_catalog_v1') sync()
        }
        window.addEventListener('gift-catalog-updated', sync)
        window.addEventListener('storage', onStorage)
        return () => {
            window.removeEventListener('gift-catalog-updated', sync)
            window.removeEventListener('storage', onStorage)
        }
    }, [])

    const handleGift = (gift) => {
        const now = Date.now()
        sentAtRef.current = sentAtRef.current.filter((t) => now - t < 60000)
        if (sentAtRef.current.length >= maxGiftsPerMinute) return
        sentAtRef.current.push(now)
        onGift(gift)
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <Gift size={18} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                        Pay with
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setGiftSpendWallet('inr')}
                        className="px-2 py-1 rounded-md text-[10px] font-semibold"
                        style={{
                            background: giftSpendWallet === 'inr' ? 'rgba(245,158,11,0.16)' : 'var(--color-surface2)',
                            color: giftSpendWallet === 'inr' ? 'var(--color-primary)' : 'var(--color-muted)',
                        }}
                    >
                        INR ₹{Math.round(inrWallet)}
                    </button>
                    <button
                        type="button"
                        onClick={() => setGiftSpendWallet('crypto')}
                        className="px-2 py-1 rounded-md text-[10px] font-semibold"
                        style={{
                            background: giftSpendWallet === 'crypto' ? 'rgba(245,158,11,0.16)' : 'var(--color-surface2)',
                            color: giftSpendWallet === 'crypto' ? 'var(--color-primary)' : 'var(--color-muted)',
                        }}
                    >
                        Crypto {Number(cryptoWallet || 0).toFixed(4)}
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                {giftTypes.map((gift) => (
                    <GiftButton
                        key={gift.id}
                        gift={gift}
                        onGift={handleGift}
                    />
                ))}
            </div>
        </div>
    )
}

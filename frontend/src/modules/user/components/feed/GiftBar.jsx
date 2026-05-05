import { useEffect, useRef, useState } from 'react'
import { Gift, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import GiftButton from './GiftButton'
import { usePlatformSettings } from '../../hooks/usePlatformSettings'
import { useWalletStore } from '../../store/useWalletStore'
import { useUserStore } from '../../store/useUserStore'
import { getActiveGiftCatalog } from '../../../../shared/giftCatalog'
import { useFeedStore } from '../../store/useFeedStore'
import HeartRainAnimation from './HeartRainAnimation'

const EMPTY_COUNTS = {}

export default function GiftBar({ postId, onGift, compact = false, showCounts = true }) {
    const { maxGiftsPerMinute } = usePlatformSettings()
    const { giftSpendWallet, setGiftSpendWallet, inrWallet, cryptoWallet, gifts, giftsLoading } = useWalletStore()
    const { profile } = useUserStore()
    const giftCountsRaw = useFeedStore((s) => s.giftCountsByPostId?.[postId])
    const giftCounts = giftCountsRaw || EMPTY_COUNTS
    const currencySymbol = profile?.currencySymbol || '₹'
    const currencyCode = profile?.currencyCode || 'INR'
    
    // Strictly dynamic: Only show gifts that exist in the backend database.
    const giftTypes = Array.isArray(gifts) ? gifts : []

    const [rainTrigger, setRainTrigger] = useState(0)
    const [activeIcon, setActiveIcon] = useState('')
    const [confirmingGift, setConfirmingGift] = useState(null)
    const [activeSound, setActiveSound] = useState(null)
    const sentAtRef = useRef([])
    const loadGifts = useWalletStore((s) => s.loadGifts)

    useEffect(() => {
        if (giftTypes.length === 0) {
            loadGifts()
        }
    }, [giftTypes.length, loadGifts])


    const handleGift = (gift) => {
        setConfirmingGift(gift)
    }

    const confirmGift = () => {
        if (!confirmingGift) return
        const gift = confirmingGift
        setConfirmingGift(null)

        const now = Date.now()
        sentAtRef.current = sentAtRef.current.filter((t) => now - t < 60000)
        if (sentAtRef.current.length >= maxGiftsPerMinute) return
        sentAtRef.current.push(now)
        
        // Normalize sound URL if it's a local upload
        let soundUrl = gift.soundUrl
        if (soundUrl && soundUrl.startsWith('/uploads')) {
            const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')
            soundUrl = `${apiBase}${soundUrl}`
        }

        // Trigger rain with specific icon and sound
        setActiveIcon(gift.emoji)
        setActiveSound(soundUrl)
        setRainTrigger(prev => prev + 1)
        
        onGift(gift)
    }

    return (
        <div className="space-y-2">
            {!compact && (
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
                            {Math.round(inrWallet)} Coins
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
            )}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-10 -my-10">
                {giftsLoading ? (
                    <div className="flex gap-2 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-16 h-8 rounded-full bg-surface2" />
                        ))}
                    </div>
                ) : giftTypes.length > 0 ? (
                    giftTypes.map((gift) => (
                        <GiftButton
                            key={gift.id}
                            gift={gift}
                            onGift={handleGift}
                            count={giftCounts[gift.id] || 0}
                            showCount={showCounts}
                        />
                    ))
                ) : (
                    <div className="text-[10px] text-muted font-medium py-2">
                        No gifts available. Please contact support.
                    </div>
                )}
            </div>
            
            <HeartRainAnimation 
                trigger={rainTrigger} 
                icon={activeIcon}
                soundUrl={activeSound}
                onComplete={() => {}} 
            />

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {confirmingGift && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setConfirmingGift(null)}
                            />
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[24px] p-6 shadow-2xl max-w-[280px] w-full text-center"
                                style={{ background: 'var(--color-surface)' }}
                            >
                                <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl">{confirmingGift.emoji}</span>
                                </div>
                                <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-text)' }}>Send Gift</h3>
                                <p className="text-xs mb-6 opacity-80" style={{ color: 'var(--color-text)' }}>
                                    Do you want to send <span className="font-bold text-orange-500">
                                        {confirmingGift.currencySymbol || currencySymbol}{confirmingGift.price}
                                    </span> to this post?
                                </p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setConfirmingGift(null)}
                                        className="flex-1 py-3 rounded-xl font-bold text-xs"
                                        style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}
                                    >
                                        No
                                    </button>
                                    <button 
                                        onClick={confirmGift}
                                        className="flex-1 py-3 rounded-xl font-bold text-xs text-white"
                                        style={{ background: 'var(--color-primary)' }}
                                    >
                                        Yes
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    )
}

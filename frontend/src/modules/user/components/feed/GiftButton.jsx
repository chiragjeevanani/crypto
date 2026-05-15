import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useUserStore } from '../../store/useUserStore'

export default function GiftButton({ gift, onGift, disabled, count = 0, showCount = true, index = 0 }) {
    const { profile } = useUserStore()
    const currencySymbol = profile?.currencySymbol || '₹'
    const [popping, setPopping] = useState(false)
    const btnRef = useRef(null)

    const handleClick = () => {
        if (disabled || popping) return
        setPopping(true)
        onGift(gift)
        setTimeout(() => setPopping(false), 800)
    }

    return (
        <div className="relative flex-shrink-0">
            <AnimatePresence>
                {popping && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0, y: 0, rotate: 0 }}
                        animate={{ 
                            opacity: [0, 1, 1, 0], 
                            scale: [0.5, 2, 1.5, 1], 
                            y: -60,
                            rotate: [0, 15, -15, 0]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]"
                    >
                        <Heart size={24} fill="#FF1E1E" stroke="none" style={{ filter: 'drop-shadow(0 0 10px rgba(255,30,30,0.4))' }} />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                ref={btnRef}
                onClick={handleClick}
                whileTap={{ scale: 0.85 }}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer select-none relative',
                    'transition-all duration-200 shadow-sm hover:shadow-md',
                    (!popping && gift.animationType === 'gift') && 'animate-gift-attract'
                )}
                style={{
                    background: 'var(--color-surface2)',
                    border: '1px solid var(--color-border)',
                    animationDelay: `${index * 0.15}s`
                }}
            >
                <span className={cn(
                    "text-base leading-none transition-transform group-hover:scale-110 inline-block",
                    gift.animationType === 'heart' && 'animate-heart-beat',
                    (gift.animationType === 'fire' || gift.emoji === '🔥') && 'animate-fire-flicker',
                    gift.animationType === 'mind_blown' && 'animate-mind-blown',
                    gift.animationType === 'monkey' && 'animate-monkey-peek',
                    gift.animationType === 'crown' && 'animate-crown-float',
                    gift.animationType === 'clap' && 'animate-clap-bounce',
                    gift.animationType === 'love' && 'animate-love-pulse',
                    gift.animationType === 'heart_fire' && 'animate-heart-fire',
                    (!['heart', 'fire', 'mind_blown', 'monkey', 'crown', 'clap', 'love', 'heart_fire'].includes(gift.animationType)) && 'animate-gift-float'
                )}>
                    {gift.emoji}
                </span>
                <span className="text-[11px] font-bold" style={{ color: 'var(--color-primary)' }}>
                    {gift.currencySymbol || currencySymbol}{gift.price || 0}
                </span>
            </motion.button>
            
            {showCount && count > 0 && (
                <span
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-[var(--color-surface)]"
                    style={{ background: 'var(--color-primary)', color: '#000' }}
                >
                    {count}
                </span>
            )}
        </div>
    )
}

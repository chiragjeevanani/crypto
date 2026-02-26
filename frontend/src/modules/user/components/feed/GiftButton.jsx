import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export default function GiftButton({ gift, onGift, disabled }) {
    const [popping, setPopping] = useState(false)
    const btnRef = useRef(null)

    const handleClick = () => {
        if (disabled || popping) return
        setPopping(true)
        setTimeout(() => setPopping(false), 380)
        onGift(gift)
    }

    return (
        <div className="relative flex-shrink-0">
            <motion.button
                ref={btnRef}
                onClick={handleClick}
                whileTap={{ scale: 0.82 }}
                animate={popping ? { scale: [1, 1.35, 1], transition: { duration: 0.3 } } : {}}
                className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer select-none',
                    'transition-colors duration-150'
                )}
                style={{
                    background: 'var(--color-surface2)',
                    border: '1px solid var(--color-border)',
                }}
            >
                <span className="text-sm leading-none">{gift.emoji}</span>
                <span className="text-[11px] font-semibold" style={{ color: 'var(--color-primary)' }}>
                    ₹{gift.price}
                </span>
            </motion.button>
        </div>
    )
}

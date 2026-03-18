import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'

const ICON_COUNT = 18
const COLORS = ['#FF1E1E', '#FFD700', '#00FF00', '#00BFFF', '#FF4500', '#FF69B4']

export default function HeartRainAnimation({ trigger, icon, onComplete }) {
    const [elements, setElements] = useState([])
    const lastTriggerRef = useRef(0)

    const spawnElements = useCallback(() => {
        const direction = Math.random() > 0.5 ? 'up' : 'down'
        const newElements = Array.from({ length: ICON_COUNT }).map((_, i) => ({
            id: Date.now() + i,
            x: Math.random() * 100, // percentage
            size: 20 + Math.random() * 25,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            delay: Math.random() * 0.2, // Snappier start
            duration: 1.6 + Math.random() * 1.2,
            direction
        }))
        setElements(newElements)
        
        // Play sound
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3')
            audio.volume = 0.3
            audio.play().catch(() => {})
        } catch (e) {
            // ignore
        }

        setTimeout(() => {
            setElements([])
            onComplete?.()
        }, 3500)
    }, [onComplete])

    useEffect(() => {
        if (trigger && trigger !== lastTriggerRef.current) {
            lastTriggerRef.current = trigger
            spawnElements()
        }
    }, [trigger, spawnElements])

    // Mount to portal to prevent clipping by parents with overflow: hidden
    return createPortal(
        <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden">
            <AnimatePresence>
                {elements.map((el) => {
                    const startY = el.direction === 'up' ? '120vh' : '-20vh'
                    const endY = el.direction === 'up' ? '-30vh' : '130vh'
                    
                    return (
                        <motion.div
                            key={el.id}
                            initial={{ y: startY, x: `${el.x}vw`, opacity: 0, scale: 0.2 }}
                            animate={{ 
                                y: endY, 
                                opacity: [0, 1, 1, 0.8, 0],
                                scale: [0.5, 1.5, 1, 1.2, 0.8],
                                rotate: [0, 180, -180, 0]
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ 
                                duration: el.duration, 
                                delay: el.delay,
                                ease: "linear" 
                            }}
                            style={{ position: 'absolute' }}
                            className="flex items-center justify-center translate-x-[-50%]"
                        >
                            {icon ? (
                                <span style={{ fontSize: el.size }}>{icon}</span>
                            ) : (
                                <Heart 
                                    size={el.size} 
                                    fill={el.color} 
                                    stroke="none"
                                    style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' }}
                                />
                            )}
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>,
        document.body
    )
}

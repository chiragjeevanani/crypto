import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const SPLAT_PATHS = {
    egg: 'M20,40 Q15,45 10,40 Q5,35 15,25 Q25,15 35,25 Q45,35 40,40 Q35,45 30,40 T20,40', // Placeholder puddle
    tomato: 'M25,50 Q10,50 10,35 Q10,20 25,20 Q40,20 40,35 Q40,50 25,50' // Placeholder splat
}

export default function PostSplat({ type, onComplete }) {
    const [phase, setPhase] = useState('fly') // fly | splat

    useEffect(() => {
        // Phase 1: Fly duration
        const timer = setTimeout(() => setPhase('splat'), 600)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (phase === 'splat') {
            const timer = setTimeout(onComplete, 2500)
            return () => clearTimeout(timer)
        }
    }, [phase, onComplete])

    return (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl">
            <AnimatePresence>
                {phase === 'fly' && (
                    <motion.div
                        key="projectile"
                        initial={{ bottom: -20, left: '50%', scale: 0.5, opacity: 0 }}
                        animate={{ bottom: '50%', left: '50%', scale: 1.2, opacity: 1 }}
                        exit={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute"
                        style={{ transform: 'translate(-50%, 50%)' }}
                    >
                        {type === 'egg' ? (
                            <div className="w-8 h-10 bg-white border-2 border-zinc-200 rounded-full shadow-lg" />
                        ) : type === 'tomato' ? (
                            <div className="w-10 h-10 bg-red-500 rounded-full shadow-lg border-2 border-red-600" />
                        ) : (
                            <div className="text-4xl text-amber-500 drop-shadow-lg">💛</div>
                        )}
                    </motion.div>
                )}

                {phase === 'splat' && (
                    <motion.div
                        key="splat"
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: type === 'heart' ? 2.5 : 1.5, opacity: type === 'heart' ? 0 : 0.9 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: type === 'heart' ? 0.8 : 0.3 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        {type === 'heart' ? (
                            <svg viewBox="0 0 100 100" className="w-32 h-32">
                                <motion.path
                                    d="M50 88C50 88 15 65 15 35C15 15 50 5 50 30C50 5 85 15 85 35C85 65 50 88 50 88Z"
                                    fill="var(--color-primary)"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [0, 1.2, 1] }}
                                    transition={{ duration: 0.5, times: [0, 0.7, 1] }}
                                />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                <motion.path
                                    d={type === 'egg'
                                        ? "M50,30 C65,30 80,45 80,60 C80,75 65,90 50,90 C35,90 20,75 20,60 C20,45 35,30 50,30"
                                        : "M50,20 C30,20 10,40 10,60 C10,80 30,95 50,90 C70,95 90,80 90,60 C90,40 70,20 50,20"}
                                    fill={type === 'egg' ? '#ffd700' : '#ef4444'}
                                    filter="blur(2px)"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                                {type === 'egg' && (
                                    <motion.circle
                                        cx="50" cy="60" r="15"
                                        fill="#ffeb3b"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                    />
                                )}
                            </svg>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

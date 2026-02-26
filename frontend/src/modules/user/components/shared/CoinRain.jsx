import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

// Global emitter — call window.__triggerCoinRain() from anywhere
let triggerFn = null
export function triggerCoinRain() {
    if (triggerFn) triggerFn()
}

export default function CoinRain() {
    const containerRef = useRef(null)

    useEffect(() => {
        triggerFn = () => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
            const container = containerRef.current
            if (!container) return

            container.style.display = 'block'

            // Create 28 coin particles
            const coins = []
            for (let i = 0; i < 28; i++) {
                const coin = document.createElement('div')
                coin.textContent = '🪙'
                coin.style.cssText = `
          position: absolute;
          font-size: ${14 + Math.random() * 14}px;
          top: -30px;
          left: ${Math.random() * 100}%;
          user-select: none;
          pointer-events: none;
        `
                container.appendChild(coin)
                coins.push(coin)
            }

            gsap.to(coins, {
                y: window.innerHeight + 60,
                x: () => (Math.random() - 0.5) * 120,
                rotation: () => Math.random() * 720 - 360,
                opacity: (i) => (i % 3 === 0 ? 0.9 : 0.7),
                duration: () => 1.2 + Math.random() * 0.8,
                ease: 'power1.in',
                stagger: 0.04,
                onComplete() {
                    coins.forEach((c) => c.remove())
                    container.style.display = 'none'
                },
            })
        }

        return () => { triggerFn = null }
    }, [])

    return (
        <div
            ref={containerRef}
            className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
            style={{ display: 'none' }}
        />
    )
}

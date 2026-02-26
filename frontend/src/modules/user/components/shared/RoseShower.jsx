import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useFeedStore } from '../../store/useFeedStore'

const ROSE_SVG = `
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 80C50 80 20 60 20 40C20 20 50 10 50 10C50 10 80 20 80 40C80 60 50 80 50 80Z" fill="#E11D48" />
    <path d="M50 10V20M20 40H30M80 40H70" stroke="#FF4D4D" stroke-width="2" />
  </svg>
`

export default function RoseShower() {
    const containerRef = useRef(null)
    const roseTrigger = useFeedStore((s) => s.roseTrigger)

    useEffect(() => {
        if (roseTrigger === 0) return

        const container = containerRef.current
        if (!container) return

        const roseCount = 35
        const roses = []

        for (let i = 0; i < roseCount; i++) {
            const rose = document.createElement('div')
            rose.className = 'absolute pointer-events-none'
            rose.style.width = `${Math.random() * 20 + 15}px`
            rose.style.height = rose.style.width
            rose.innerHTML = ROSE_SVG
            container.appendChild(rose)
            roses.push(rose)

            const startX = Math.random() * window.innerWidth
            const endX = startX + (Math.random() - 0.5) * 200

            gsap.set(rose, {
                x: startX,
                y: -50,
                rotation: Math.random() * 360,
                opacity: 1
            })

            gsap.to(rose, {
                y: window.innerHeight + 50,
                x: endX,
                rotation: Math.random() * 720,
                duration: Math.random() * 2 + 2,
                ease: 'none',
                delay: Math.random() * 1.5,
                onComplete: () => {
                    rose.remove()
                }
            })
        }
    }, [roseTrigger])

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
        />
    )
}

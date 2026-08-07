import { useState, useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'

export default function PullToRefresh({ children, onRefresh, disabled = false }) {
    const [pullDistance, setPullDistance] = useState(0)
    const [refreshing, setRefreshing] = useState(false)
    const containerRef = useRef(null)
    const touchStartRef = useRef({ x: 0, y: 0 })
    const isPullingRef = useRef(false)

    // Pull threshold in pixels to trigger refresh
    const THRESHOLD = 65
    // Maximum pull distance to prevent infinite dragging
    const MAX_PULL = 90

    useEffect(() => {
        if (disabled) return
        const container = containerRef.current?.parentElement || containerRef.current
        if (!container) return

        const handleTouchStart = (e) => {
            // Only allow pull-to-refresh if container is at the top
            if (container.scrollTop <= 0) {
                touchStartRef.current = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                }
                isPullingRef.current = true
            }
        }

        const handleTouchMove = (e) => {
            if (!isPullingRef.current || refreshing) return

            const touchY = e.touches[0].clientY
            const touchX = e.touches[0].clientX
            const diffY = touchY - touchStartRef.current.y
            const diffX = touchX - touchStartRef.current.x

            // If pulling down and vertical drag is dominant
            if (diffY > 0 && Math.abs(diffY) > Math.abs(diffX)) {
                // Apply a resistance formula so pulling feels elastic
                const resistance = 2.2
                const newPull = Math.min(MAX_PULL, diffY / resistance)
                setPullDistance(newPull)

                // Prevent native browser pull-to-refresh and bouncing
                if (e.cancelable) {
                    e.preventDefault()
                }
            } else if (diffY < 0) {
                // If user scrolls up, reset pulling state
                isPullingRef.current = false
                setPullDistance(0)
            }
        }

        const handleTouchEnd = () => {
            if (!isPullingRef.current) return
            isPullingRef.current = false

            if (pullDistance >= THRESHOLD && !refreshing) {
                setRefreshing(true)
                setPullDistance(THRESHOLD)

                // Trigger reload/callback
                if (onRefresh) {
                    onRefresh().finally(() => {
                        // Reset spinner state if callback completes (in case of no hard reload)
                        setPullDistance(0)
                        setRefreshing(false)
                    })
                } else {
                    // Fallback to window reload
                    setTimeout(() => {
                        window.location.reload()
                    }, 500) // Small delay to let the user see the spinning state
                }
            } else {
                // Return spinner to top with ease
                setPullDistance(0)
            }
        }

        container.addEventListener('touchstart', handleTouchStart, { passive: true })
        container.addEventListener('touchmove', handleTouchMove, { passive: false })
        container.addEventListener('touchend', handleTouchEnd, { passive: true })

        return () => {
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', handleTouchEnd)
        }
    }, [pullDistance, refreshing, onRefresh, disabled])

    // Rotation calculation based on pull distance
    const rotateAngle = Math.min(360, (pullDistance / THRESHOLD) * 360)

    return (
        <div 
            ref={containerRef} 
            className="w-full flex flex-col"
        >
            {/* Pull Indicator overlay */}
            <div 
                className="absolute left-0 right-0 flex justify-center z-50 pointer-events-none transition-all duration-150 ease-out"
                style={{
                    transform: `translateY(${pullDistance - 40}px)`,
                    opacity: pullDistance > 10 ? 1 : 0
                }}
            >
                <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-white/10"
                    style={{ 
                        background: 'var(--color-surface)',
                        color: 'var(--color-primary)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    <RefreshCw 
                        size={16} 
                        className={`${refreshing ? 'animate-spin' : ''}`}
                        style={{
                            transform: refreshing ? 'none' : `rotate(${rotateAngle}deg)`,
                            transition: refreshing ? 'none' : 'transform 0.05s linear'
                        }}
                    />
                </div>
            </div>

            {/* Child content */}
            <div className="flex-1 w-full flex flex-col">
                {children}
            </div>
        </div>
    )
}

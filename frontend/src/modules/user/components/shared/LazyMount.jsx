import { useEffect, useRef, useState } from 'react'

/**
 * Defers mounting expensive children until they scroll near the viewport, then
 * keeps them mounted for good (no unmount-on-scroll-away, to avoid re-render/pop
 * flicker for content the user has already seen). Renders `placeholder` in a
 * plain div until then, so long unpaginated lists don't pay the full mount cost
 * of every item up front.
 */
export default function LazyMount({ children, placeholder = null, rootMargin = '600px 0px' }) {
    const ref = useRef(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (visible) return
        const node = ref.current
        if (!node || typeof IntersectionObserver === 'undefined') {
            setVisible(true)
            return
        }
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                setVisible(true)
                observer.disconnect()
            }
        }, { rootMargin })
        observer.observe(node)
        return () => observer.disconnect()
    }, [visible, rootMargin])

    if (visible) return children

    return <div ref={ref}>{placeholder}</div>
}

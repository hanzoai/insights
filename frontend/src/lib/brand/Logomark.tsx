import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'

// Hanzo Insights logomark — the canonical @hanzo/logo block-H mark.
// fill-[var(--brand-key)] flips #000→#fff in dark mode (styles/base.scss),
// so the mark stays legible on both light and dark chrome. The five paths are
// direct children of <svg> so AnimatedLogomark's `svg > *` jump targets them.
export function Logomark(): JSX.Element {
    return (
        <svg width="28" height="28" viewBox="0 0 67 67" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g className="fill-[var(--brand-key)] dark:fill-white">
                <path d="M22.21 67V44.6369H0V67H22.21Z" />
                <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" />
                <path d="M22.21 0H0V22.3184H22.21V0Z" />
                <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" />
                <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" />
            </g>
        </svg>
    )
}

export interface AnimatedLogomarkProps {
    /** Animate the logomark continuously (e.g. during loading states) */
    animate: boolean
    /** Play a single animation cycle and call the provided callback when done */
    animateOnce?: () => void
    className?: string
}

/**
 * Animated Insights logomark that jumps continuously while `animate` is true.
 *
 * When `animate` becomes false, the animation completes its current cycle before
 * stopping - it won't cut off mid-jump.
 *
 * When `animateOnce` is provided, plays a single animation cycle and calls
 * the provided callback when done.
 */
export function AnimatedLogomark({ animate, animateOnce, className }: AnimatedLogomarkProps): JSX.Element {
    const ref = useRef<HTMLDivElement | null>(null)
    const [isAnimating, setIsAnimating] = useState(false)
    const shouldStopRef = useRef(false)
    const animateOnceRef = useRef(animateOnce)

    animateOnceRef.current = animateOnce

    // Track stop intent via ref so the listener always sees current value
    // without needing to be re-attached when `animate` changes
    shouldStopRef.current = !animate && isAnimating

    // Start animation immediately when requested
    useEffect(() => {
        if (animate || animateOnce) {
            setIsAnimating(true)
        }
    }, [animate, animateOnce])

    // Set up iteration listener once when animation starts.
    // The listener checks shouldStopRef on each cycle to decide whether to stop.
    useEffect(() => {
        if (!isAnimating || !ref.current) {
            return
        }

        const animatedElement = ref.current.querySelector('svg > *')
        if (!animatedElement) {
            return
        }

        const handleAnimationIteration = (): void => {
            if (animateOnceRef.current) {
                setIsAnimating(false)
                animateOnceRef.current()
            } else if (shouldStopRef.current) {
                setIsAnimating(false)
            }
        }

        animatedElement.addEventListener('animationiteration', handleAnimationIteration)
        return () => {
            animatedElement.removeEventListener('animationiteration', handleAnimationIteration)
        }
    }, [isAnimating])

    return (
        <div ref={ref} className={clsx(className, isAnimating && 'animate-logomark-jump-continuous')}>
            <Logomark />
        </div>
    )
}

import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { MARK_PATHS, MARK_VIEWBOX } from '@hanzo/logo'

// Hanzo Insights logomark — the canonical @hanzo/logo block-H mark. Geometry is
// sourced from @hanzo/logo (MARK_PATHS, the ONE home) — no longer re-typed here.
// fill-[var(--brand-key)] flips #000→#fff in dark mode (styles/base.scss), so
// the mark stays legible on both light and dark chrome. The paths live under a
// single <g> child so AnimatedLogomark's `svg > *` jump still targets it.
export function Logomark(): JSX.Element {
    return (
        <svg width="28" height="28" viewBox={MARK_VIEWBOX} fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* MARK_PATHS is a build-time-trusted @hanzo/logo constant — never user input. */}
            <g className="fill-[var(--brand-key)] dark:fill-white" dangerouslySetInnerHTML={{ __html: MARK_PATHS }} />
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

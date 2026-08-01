import { Insights } from 'insights-js'
import { useEffect, useRef } from 'react'

import { toolbarConfigLogic } from '~/toolbar/toolbarConfigLogic'

export function useScrollSync(enabled: boolean = true): {
    innerRef: React.RefObject<HTMLDivElement>
    scrollYRef: React.MutableRefObject<number>
} {
    const innerRef = useRef<HTMLDivElement>(null)
    const scrollYRef = useRef<number>(0)

    useEffect(() => {
        if (!enabled) {
            scrollYRef.current = 0
            return
        }

        let insightsInstance: Insights | null = null
        try {
            insightsInstance = toolbarConfigLogic.values.insights
        } catch {
            // toolbarConfigLogic not mounted — fall back to window.scrollY
        }

        let rafId: number | undefined
        let lastScrollY = -1

        const onFrame = (): void => {
            const scrollY = insightsInstance?.scrollManager?.scrollY() ?? window.scrollY
            if (scrollY !== lastScrollY) {
                lastScrollY = scrollY
                scrollYRef.current = scrollY
                const inner = innerRef.current
                if (inner) {
                    inner.style.transform = `translateY(${-scrollY}px)`
                }
            }
            rafId = requestAnimationFrame(onFrame)
        }

        rafId = requestAnimationFrame(onFrame)

        return () => {
            if (rafId !== undefined) {
                cancelAnimationFrame(rafId)
            }
        }
    }, [enabled])

    return { innerRef, scrollYRef }
}

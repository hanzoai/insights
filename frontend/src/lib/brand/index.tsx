// The app-facing entry point for the Insights logo. Always import from `lib/brand` — never
// reach for the mark's paths directly, so the sizing and theming rules below can't drift
// per-consumer.
//
// The mark is Hanzo's own: five squares and a bar, the same glyph as `public/icons/
// safari-pinned-tab.svg` and the favicon on hanzo.ai. It is monochrome by construction and
// fills with `currentColor`, so it inverts with the surrounding text in dark mode and inside
// the toolbar's shadow DOM without a second copy or a gradient to resolve.
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'

import { cn } from 'lib/utils/css-classes'

/**
 * Named logo sizes. Callers pick one of these instead of hand-tuning pixel dimensions per surface —
 * `md` is the standard logo. A token sets the rendered **height**; width always follows from the
 * mark's aspect ratio, so call sites never set width and height themselves. Omit `size` to fill the
 * container (`width: 100%`, e.g. the toolbar).
 */
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const LOGO_SIZE_HEIGHTS: Record<LogoSize, number> = {
    xs: 20, // minimal: exporter chrome, where the logo is a byline rather than a header
    sm: 24, // compact: watermarks, inline marks
    md: 28, // default: the standard logo (player, most surfaces)
    lg: 32, // prominent: page headers users linger on (login, onboarding)
    xl: 48, // hero: emphasis surfaces (coupon campaigns, splash screens)
}

/** Drives the toolbar's loading hop; see {@link Logomark}. */
export interface LogomarkHandle {
    /** Play one hop. Returns false when it was suppressed (in flight, or reduced motion). */
    jump: () => boolean
}

export interface AppLogomarkProps extends React.SVGAttributes<SVGSVGElement> {
    size?: LogoSize
    /** Hop when clicked. */
    jumpOnClick?: boolean
}

export interface AppLogoProps extends Omit<AppLogomarkProps, 'jumpOnClick'> {
    /** Hide the wordmark and render the mark alone. */
    markOnly?: boolean
}

const HOP_MS = 400

/**
 * The Hanzo mark. Monochrome and `currentColor`-filled, so the surrounding text color drives it
 * on every surface and in both themes.
 */
export const Logomark = forwardRef<LogomarkHandle, AppLogomarkProps>(function Logomark(
    { size, className, jumpOnClick, onClick, ...props },
    ref
) {
    const svgRef = useRef<SVGSVGElement>(null)
    const inFlight = useRef(false)

    const jump = useCallback((): boolean => {
        const el = svgRef.current
        // No element, a hop already in the air, or a reader who asked for less motion.
        if (!el || inFlight.current || !el.animate) {
            return false
        }
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            return false
        }
        inFlight.current = true
        const hop = el.animate(
            [{ transform: 'translateY(0)' }, { transform: 'translateY(-25%)' }, { transform: 'translateY(0)' }],
            { duration: HOP_MS, easing: 'cubic-bezier(0.28, 0.84, 0.42, 1)' }
        )
        hop.onfinish = hop.oncancel = () => {
            inFlight.current = false
        }
        return true
    }, [])

    useImperativeHandle(ref, () => ({ jump }), [jump])

    return (
        <svg
            ref={svgRef}
            viewBox="0 0 67 67"
            fill="currentColor"
            role="img"
            aria-label="Insights"
            height={size ? LOGO_SIZE_HEIGHTS[size] : undefined}
            className={cn(!size && !className && 'w-full', className)}
            onClick={(e) => {
                if (jumpOnClick) {
                    jump()
                }
                onClick?.(e)
            }}
            {...props}
        >
            <path d="M22.21 67V44.6369H0V67H22.21Z" />
            <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" />
            <path d="M22.21 0H0V22.3184H22.21V0Z" />
            <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" />
            <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" />
        </svg>
    )
})

/**
 * The full logo: the mark beside the product name. Inherits color from its surroundings the same
 * way {@link Logomark} does, so it needs no per-theme variant.
 */
export function Logo({ size, className, markOnly, ...props }: AppLogoProps): JSX.Element {
    const height = size ? LOGO_SIZE_HEIGHTS[size] : undefined
    if (markOnly) {
        return <Logomark size={size} className={className} {...props} />
    }
    return (
        <span className={cn('inline-flex items-center gap-2', className)} style={{ height }}>
            <Logomark size={size} className={size ? undefined : 'h-full w-auto'} {...props} />
            <span className="font-title font-bold leading-none" style={{ fontSize: height ? height * 0.7 : '1em' }}>
                Insights
            </span>
        </span>
    )
}

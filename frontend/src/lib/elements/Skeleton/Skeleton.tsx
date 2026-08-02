import './Skeleton.scss'

import { useCancelAnimationsOnUnmount } from 'lib/hooks/useCancelAnimationsOnUnmount'
import { ButtonProps } from 'lib/elements/Button'
import { range } from 'lib/utils/arrays'
import { cn } from 'lib/utils/css-classes'

export interface SkeletonProps {
    className?: string
    /** Repeat this component this many of times */
    repeat?: number
    /** Used in combination with repeat to progressively fade out the repeated skeletons */
    fade?: boolean
    active?: boolean
}

// Extracted as its own component so each `repeat={N}` instance gets its own
// ref + `useCancelAnimationsOnUnmount` hook. Inlining this back into
// `Skeleton` would mean the same JSX is reused across N repeats, all
// sharing one ref — only the last-mounted skeleton would have its animations
// cancelled, silently disabling the leak fix for the repeat case.
function SkeletonItem({
    className,
    active = true,
}: Pick<SkeletonProps, 'className' | 'active'>): JSX.Element {
    const ref = useCancelAnimationsOnUnmount<HTMLDivElement>()
    return (
        <div
            ref={ref}
            className={cn('Skeleton rounded', !active && 'Skeleton--static', className || 'h-4 w-full')}
        >
            {/* The span is for accessibility, but also because @storybook/test-runner smoke tests require content */}
            <span>Loading…</span>
        </div>
    )
}

export function Skeleton({ className, repeat, active = true, fade = false }: SkeletonProps): JSX.Element {
    if (repeat) {
        return (
            <>
                {range(repeat).map((i) => (
                    // eslint-disable-next-line react/forbid-dom-props
                    <div key={i} style={fade ? { opacity: 1 - i / repeat } : undefined}>
                        <SkeletonItem className={className} active={active} />
                    </div>
                ))}
            </>
        )
    }
    return <SkeletonItem className={className} active={active} />
}

Skeleton.Text = function SkeletonText({ className, ...props }: SkeletonProps) {
    return <Skeleton className={cn('flex-inline rounded h-6 w-full', className)} {...props} />
}

Skeleton.Row = function SkeletonRow({ className, ...props }: SkeletonProps) {
    return <Skeleton className={cn('rounded h-10 w-full', className)} {...props} />
}

Skeleton.Circle = function SkeletonCircle({ className, ...props }: SkeletonProps) {
    return <Skeleton className={cn('rounded-full shrink-0', className || 'h-10 w-10')} {...props} />
}

Skeleton.Button = function SkeletonButton({
    className,
    size,
    ...props
}: SkeletonProps & { size?: ButtonProps['size'] }) {
    return (
        <Skeleton
            className={cn(
                'rounded px-3',
                size === 'small' && 'h-10',
                (!size || size === 'medium') && 'h-10',
                className || 'w-20'
            )}
            {...props}
        />
    )
}

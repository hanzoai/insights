import './Badge.scss'

import clsx from 'clsx'
import { forwardRef } from 'react'
import { CSSTransition } from 'react-transition-group'

import { compactNumber, humanFriendlyNumber } from 'lib/utils'

interface BadgePropsBase {
    size?: 'xsmall' | 'small' | 'medium' | 'large'
    position?: 'none' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    className?: string
    status?: 'primary' | 'success' | 'warning' | 'danger' | 'muted' | 'data'
    active?: boolean
    style?: React.CSSProperties
    title?: string
}

export interface BadgeProps extends BadgePropsBase {
    content?: string | JSX.Element
    visible?: boolean
}

export interface BadgeNumberProps extends BadgePropsBase {
    count: number
    /** Maximum number of digits shown at once. Default value: 1 (so all numbers above 9 are shown as "9+"). */
    maxDigits?: number
    showZero?: boolean
    /**
     * Whether to force the badge to show a plus with the number e.g. if we know we have the count of a page of values but there are more available
     */
    forcePlus?: boolean
}

/** An icon-sized badge. */
const BadgeComponent: React.FunctionComponent<BadgeProps & React.RefAttributes<HTMLSpanElement>> = forwardRef(
    function BadgeComponent(
        {
            content,
            visible = true,
            size = 'medium',
            position = 'none',
            className,
            status = 'primary',
            active = false,
            ...spanProps
        },
        ref
    ): JSX.Element {
        return (
            <CSSTransition in={visible} timeout={150} classNames="Badge-" mountOnEnter unmountOnExit>
                <span
                    ref={ref}
                    className={clsx(
                        'Badge',
                        !content && 'Badge--dot',
                        `Badge--${size}`,
                        `Badge--${status}`,
                        `Badge--position-${position}`,
                        active && 'Badge--active',
                        className
                    )}
                    {...spanProps}
                >
                    {content}
                </span>
            </CSSTransition>
        )
    }
)

/** An icon-sized badge for displaying a count.
 *
 * Numbers up to 9 are displayed in full, in integer form, with 9+ for higher values.
 * JSX elements are rendered outright to support use cases where the badge is meant to show an icon.
 * If `showZero` is set to `true`, the component won't be hidden if the count is 0.
 */
const BadgeNumber: React.FunctionComponent<BadgeNumberProps & React.RefAttributes<HTMLSpanElement>> =
    forwardRef(function BadgeNumber(
        { count, maxDigits = 1, showZero = false, forcePlus = false, ...badgeProps },
        ref
    ): JSX.Element {
        if (maxDigits < 1) {
            throw new Error('maxDigits must be at least 1')
        }

        // NOTE: We use 1 for the text if not showing so the fade out animation looks right
        let text =
            typeof count === 'object'
                ? count
                : typeof count === 'number' && count !== 0
                  ? count < Math.pow(10, maxDigits)
                      ? compactNumber(count)
                      : `${'9'.repeat(maxDigits)}+`
                  : showZero
                    ? '0'
                    : '1'

        if (forcePlus && !text.includes('+')) {
            text += '+'
        }

        const hide = count === undefined || (count == 0 && !showZero)

        return (
            <Badge
                ref={ref}
                visible={!hide}
                title={typeof count === 'number' ? humanFriendlyNumber(count) : undefined}
                content={text}
                {...badgeProps}
            />
        )
    })

export const Badge = Object.assign(BadgeComponent, { Number: BadgeNumber })

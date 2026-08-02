import './Row.scss'

import clsx from 'clsx'
import React from 'react'

import { Spinner } from '../Spinner/Spinner'
import { Tooltip } from '../Tooltip'

export interface RowPropsBase<T extends keyof JSX.IntrinsicElements> extends Omit<
    React.HTMLProps<JSX.IntrinsicElements[T]>,
    'ref' | 'size'
> {
    icon?: React.ReactElement | null
    /** HTML tag to render the row with. */
    tag?: T
    status?: 'default' | 'success' | 'warning' | 'danger' | 'highlighted' | 'muted'
    /** Extended content, e.g. a description, to show in the lower button area. */
    extendedContent?: React.ReactNode
    loading?: boolean
    /** Tooltip to display on hover. */
    tooltip?: any
    /** Whether the row should take up the parent's full width. */
    fullWidth?: boolean
    /** Whether the row's contents should be centered. */
    center?: boolean
    /** Whether the element should be outlined with a standard border. */
    outlined?: any
    /** Variation on sizes - default is medium.
     * Small looks better inline with text.
     * Large is a chunkier row.
     * Tall is a chunkier row without changing font size.
     * */
    size?: 'small' | 'medium' | 'tall' | 'large'
    'data-attr'?: string
}

export interface RowProps<T extends keyof JSX.IntrinsicElements = 'div'> extends RowPropsBase<T> {
    sideIcon?: React.ReactElement | false | null
}

/** Generic UI row component. Can be exploited as a button (see Button) or just as a standard row of content.
 *
 * Do NOT use for general layout if you simply need flexbox though. In that case `<div className="flex">` is much lighter.
 */
export const Row = React.forwardRef(function RowInternal<T extends keyof JSX.IntrinsicElements = 'div'>(
    {
        children,
        icon,
        className,
        tag,
        status = 'default',
        extendedContent,
        tooltip,
        sideIcon,
        size = 'medium',
        loading = false,
        fullWidth = false,
        center = false,
        outlined = false,
        disabled = false,
        ...props
    }: RowProps<T>,
    ref: React.Ref<HTMLElement>
): JSX.Element {
    const symbolic = children === null || children === undefined || children === false
    if (loading) {
        icon = <Spinner />
    }
    const element = React.createElement(
        tag || 'div',
        {
            className: clsx(
                'Row',
                className,
                status && status !== 'default' ? `Row--status-${status}` : undefined,
                symbolic && 'Row--symbolic',
                fullWidth && 'Row--full-width',
                disabled && 'Row--disabled',
                outlined && 'Row--outlined',
                center && 'Row--center',
                size === 'large' && 'Row--large',
                size === 'tall' && 'Row--tall',
                size === 'small' && 'Row--small'
            ),
            disabled,
            ...props,
            ref,
        },
        <>
            <div className="Row__main-area">
                {icon && <span className="Row__icon">{icon}</span>}
                {!symbolic && <div className="Row__content">{children}</div>}
                {sideIcon && <span className="Row__icon">{sideIcon}</span>}
            </div>
            {extendedContent && <div className="Row__extended-area">{extendedContent}</div>}
        </>
    )
    return tooltip ? <Tooltip title={tooltip}>{element}</Tooltip> : element
})

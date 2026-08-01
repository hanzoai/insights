import './Tag.scss'

import clsx from 'clsx'
import { HTMLProps, forwardRef } from 'react'

import { IconEllipsis, IconX } from '@hanzo/icons'

import { Button, ButtonWithDropdown } from 'lib/elements/Button'
import { ButtonDropdown } from 'lib/elements/Button'

export type TagType =
    | 'primary'
    | 'option'
    | 'highlight'
    | 'warning'
    | 'danger'
    | 'success'
    | 'default'
    | 'muted'
    | 'completion'
    | 'caution'
    | 'none'

export interface TagProps {
    type?: TagType
    children: React.ReactNode
    size?: 'small' | 'medium'
    weight?: 'normal'
    icon?: JSX.Element
    closable?: boolean
    onClose?: () => void
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
    popover?: ButtonDropdown
    className?: string
    disabledReason?: string | null
    title?: string
    'data-attr'?: string
    /** When true, the icon will swap to a close icon on hover and the entire tag becomes clickable to close */
    closeOnClick?: boolean
    /** Keep the cursor-pointer / role="button" affordance even when wrapped in a `<Tooltip>` (Base UI's tooltip injects its own onClick which would otherwise suppress it). */
    forceClickable?: boolean
}

export const Tag: React.FunctionComponent<
    TagProps & React.RefAttributes<HTMLDivElement> & Omit<HTMLProps<HTMLDivElement>, keyof TagProps>
> = forwardRef(function Tag(
    {
        type = 'default',
        children,
        className,
        size = 'medium',
        weight,
        icon,
        closable,
        onClose,
        popover,
        disabledReason,
        closeOnClick,
        onClick,
        forceClickable,
        ...props
    },
    ref
): JSX.Element {
    // Base UI's Tooltip injects an onClick onto its trigger child; don't treat that as dev intent unless forceClickable is set.
    const isTooltipTrigger = 'data-base-ui-tooltip-trigger' in props
    const isCloseClickable = !!(closeOnClick && icon && onClose)
    const isClickable = (!!onClick && (!isTooltipTrigger || forceClickable)) || isCloseClickable
    return (
        <div
            ref={ref}
            className={clsx(
                'Tag',
                `Tag--size-${size}`,
                disabledReason ? 'cursor-not-allowed' : isClickable ? 'cursor-pointer' : undefined,
                `Tag--${type}`,
                weight && `Tag--${weight}`,
                closeOnClick && 'Tag--close-on-click',
                className
            )}
            role={isClickable ? 'button' : undefined}
            title={disabledReason || undefined}
            aria-disabled={disabledReason ? true : undefined}
            {...props}
            onClick={
                closeOnClick && icon && onClose
                    ? (e) => {
                          e.stopPropagation()
                          onClose()
                      }
                    : onClick
            }
        >
            {icon && closeOnClick && onClose ? (
                <span className="Tag__icon-container">
                    <span className="Tag__icon Tag__icon--default">{icon}</span>
                    <span className="Tag__icon-close Tag__icon--hover">
                        <IconX className="h-3.5 w-3.5" />
                    </span>
                </span>
            ) : (
                icon && <span className="Tag__icon">{icon}</span>
            )}
            {children}
            {popover?.overlay && (
                <ButtonWithDropdown
                    dropdown={popover}
                    size="small"
                    className="Tag__right-button"
                    icon={<IconEllipsis />}
                    onClick={(e) => {
                        e.stopPropagation()
                    }}
                />
            )}
            {closable && !(closeOnClick && icon && onClose) && (
                <Button
                    icon={<IconX className="h-3.5 w-3.5" />}
                    onClick={(e) => {
                        e.stopPropagation()
                        onClose?.()
                    }}
                    size="xsmall"
                    className="Tag__right-button"
                />
            )}
        </div>
    )
})

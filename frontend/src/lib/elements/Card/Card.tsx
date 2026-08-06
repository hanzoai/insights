import './Card.scss'

import { forwardRef } from 'react'

import { IconX } from '@hanzo/icons'

import { cn } from 'lib/utils/css-classes'

import { Button } from '../Button'

export interface CardProps {
    hoverEffect?: boolean
    className?: string
    children?: React.ReactNode
    onClick?: () => void
    focused?: boolean
    'data-attr'?: string
    closeable?: boolean
    onClose?: () => void
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
    { hoverEffect = true, className, children, onClick, focused, closeable, onClose, ...props },
    ref
): JSX.Element {
    return (
        <div
            ref={ref}
            className={cn(
                'Card border rounded p-6 bg-surface-primary relative',
                {
                    'Card--hoverEffect': hoverEffect,
                    'border-2 border-accent': focused,
                    'border-primary': !focused,
                    'cursor-pointer': !!onClick && !focused,
                },
                className
            )}
            onClick={onClick}
            {...props}
        >
            {closeable ? (
                <div className="absolute top-2 right-2">
                    <Button
                        icon={<IconX />}
                        onClick={(e) => {
                            e.stopPropagation()
                            onClose?.()
                        }}
                        type="tertiary"
                        size="xsmall"
                    />
                </div>
            ) : null}
            {children}
        </div>
    )
})

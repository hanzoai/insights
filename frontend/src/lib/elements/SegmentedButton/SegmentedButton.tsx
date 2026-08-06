import './SegmentedButton.scss'

import clsx from 'clsx'
import React from 'react'

import { useSliderPositioning } from '../hooks'
import { Button, ButtonProps } from '../Button'

// Expects at least one of label or icon to be provided
export type SegmentedButtonOption<T extends React.Key> = { value: T } & (
    | { label: string | JSX.Element }
    | { icon: JSX.Element }
) & {
        label?: string | JSX.Element
        icon?: JSX.Element
        disabledReason?: string
        tooltip?: string | JSX.Element
        'data-attr'?: string
    }

export interface SegmentedButtonProps<T extends React.Key> {
    value?: T
    onChange?: (newValue: T, e: React.MouseEvent) => void
    options: SegmentedButtonOption<T>[]
    disabledReason?: string
    size?: ButtonProps['size']
    className?: string
    fullWidth?: boolean
}

interface SegmentedButtonCSSProperties extends React.CSSProperties {
    '--lemon-segmented-button-slider-width': `${number}px`
    '--lemon-segmented-button-slider-offset': `${number}px`
}

/** Button-radio hybrid. Single choice. */
export function SegmentedButton<T extends React.Key>({
    value,
    onChange,
    options,
    disabledReason,
    size,
    fullWidth,
    className,
}: SegmentedButtonProps<T>): JSX.Element {
    const { containerRef, selectionRef, sliderWidth, sliderOffset, transitioning } = useSliderPositioning<
        HTMLDivElement,
        HTMLLIElement
    >(value, 200)

    return (
        <div
            className={clsx(
                'SegmentedButton',
                fullWidth && 'SegmentedButton--full-width',
                transitioning && 'SegmentedButton--transitioning',
                className
            )}
            // eslint-disable-next-line react/forbid-dom-props
            style={
                {
                    '--lemon-segmented-button-slider-width': `${sliderWidth}px`,
                    '--lemon-segmented-button-slider-offset': `${sliderOffset}px`,
                } as SegmentedButtonCSSProperties
            }
            ref={containerRef}
        >
            {sliderWidth > 0 && (
                <div
                    className={clsx(
                        'SegmentedButton__slider',
                        value === options[0].value
                            ? 'SegmentedButton__slider--first'
                            : value === options[options.length - 1].value
                              ? 'SegmentedButton__slider--last'
                              : null
                    )}
                />
            )}
            <ul>
                {options.map((option) => {
                    const optionDisabledReason = option.disabledReason ?? disabledReason

                    return (
                        <li
                            key={option.value}
                            className={clsx(
                                'SegmentedButton__option',
                                optionDisabledReason && 'SegmentedButton__option--disabled',
                                option.value === value && 'SegmentedButton__option--selected'
                            )}
                            ref={option.value === value ? selectionRef : undefined}
                        >
                            <Button
                                type={option.value === value ? 'primary' : 'secondary'}
                                size={size}
                                fullWidth
                                disabledReason={optionDisabledReason}
                                onClick={(e) => {
                                    if (!optionDisabledReason) {
                                        onChange?.(option.value, e)
                                    }
                                }}
                                icon={option.icon}
                                data-attr={option['data-attr']}
                                tooltip={option.tooltip}
                                center
                            >
                                {option.label}
                            </Button>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

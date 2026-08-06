import './SegmentedDropdown.scss'

import clsx from 'clsx'
import React, { useMemo } from 'react'

import { useSliderPositioning } from '../hooks'
import { Button, ButtonProps } from '../Button'
import { Menu } from '../Menu/Menu'
import { SegmentedButtonOption } from './SegmentedButton'

export interface SegmentedDropdownProps<T extends React.Key> {
    value?: T
    onChange?: (newValue: T, e?: React.MouseEvent) => void
    options: SegmentedButtonOption<T>[]
    /** Number of options to show as buttons (remaining options go in dropdown). If not provided, all options shown as buttons. */
    splitIndex?: number
    /** Multiple split points to create separate dropdown groups. Each number marks the start of a new dropdown group. Overrides splitIndex if provided. */
    splitIndices?: number[]
    size?: ButtonProps['size']
    className?: string
    fullWidth?: boolean
}

interface SegmentedDropdownCSSProperties extends React.CSSProperties {
    '--lemon-segmented-button-slider-width': `${number}px`
    '--lemon-segmented-button-slider-offset': `${number}px`
}

/** Hybrid component showing initial options as segmented buttons and remaining options as dropdown(s). */
export function SegmentedDropdown<T extends React.Key>({
    value,
    onChange,
    options,
    splitIndex,
    splitIndices,
    size,
    fullWidth,
    className,
}: SegmentedDropdownProps<T>): JSX.Element {
    const effectiveSplitIndices = splitIndices ?? (splitIndex !== undefined ? [splitIndex] : [options.length])
    const firstSplit = effectiveSplitIndices[0] ?? options.length
    const buttonOptions = options.slice(0, firstSplit)

    const dropdownGroups = useMemo(() => {
        const groups: SegmentedButtonOption<T>[][] = []
        for (let i = 0; i < effectiveSplitIndices.length; i++) {
            const start = effectiveSplitIndices[i]
            const end = effectiveSplitIndices[i + 1] ?? options.length
            const group = options.slice(start, end)
            if (group.length > 0) {
                groups.push(group)
            }
        }
        return groups
    }, [options, effectiveSplitIndices])

    const isAnyDropdownValueSelected = dropdownGroups.some((group) => group.some((opt) => opt.value === value))

    const { containerRef, selectionRef, sliderWidth, sliderOffset, transitioning } = useSliderPositioning<
        HTMLDivElement,
        HTMLLIElement
    >(value, 200)

    const isFirstSelected = value === buttonOptions[0]?.value
    const isLastButtonSelected = value === buttonOptions[buttonOptions.length - 1]?.value && !isAnyDropdownValueSelected

    return (
        <div
            className={clsx(
                'SegmentedDropdown',
                fullWidth && 'SegmentedDropdown--full-width',
                transitioning && 'SegmentedDropdown--transitioning',
                className
            )}
            // eslint-disable-next-line react/forbid-dom-props
            style={
                {
                    '--lemon-segmented-button-slider-width': `${sliderWidth}px`,
                    '--lemon-segmented-button-slider-offset': `${sliderOffset}px`,
                } as SegmentedDropdownCSSProperties
            }
            ref={containerRef}
        >
            {sliderWidth > 0 && (
                <div
                    className={clsx(
                        'SegmentedDropdown__slider',
                        isFirstSelected
                            ? 'SegmentedDropdown__slider--first'
                            : isLastButtonSelected || isAnyDropdownValueSelected
                              ? 'SegmentedDropdown__slider--last'
                              : null
                    )}
                />
            )}
            <ul>
                {buttonOptions.map((option) => (
                    <li
                        key={option.value}
                        className={clsx(
                            'SegmentedDropdown__option',
                            option.disabledReason && 'SegmentedDropdown__option--disabled',
                            option.value === value && 'SegmentedDropdown__option--selected'
                        )}
                        ref={option.value === value ? selectionRef : undefined}
                    >
                        <Button
                            type={option.value === value ? 'primary' : 'secondary'}
                            size={size}
                            fullWidth
                            disabledReason={option.disabledReason}
                            onClick={(e) => {
                                if (!option.disabledReason) {
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
                ))}
                {dropdownGroups.map((group, groupIndex) => {
                    const isGroupValueSelected = group.some((opt) => opt.value === value)
                    const selectedOption = group.find((opt) => opt.value === value)
                    const menuItems = group.map((option) => ({
                        label: option.label ?? '',
                        icon: option.icon,
                        active: option.value === value,
                        onClick: (e: React.MouseEvent) => {
                            onChange?.(option.value, e)
                        },
                        disabledReason: option.disabledReason,
                        tooltip: option.tooltip,
                        'data-attr': option['data-attr'],
                    }))

                    return (
                        <li
                            key={`dropdown-${groupIndex}`}
                            className={clsx(
                                'SegmentedDropdown__option',
                                'SegmentedDropdown__option--dropdown',
                                isGroupValueSelected && 'SegmentedDropdown__option--selected'
                            )}
                            ref={isGroupValueSelected ? selectionRef : undefined}
                        >
                            <Menu items={menuItems}>
                                <Button
                                    type={isGroupValueSelected ? 'primary' : 'secondary'}
                                    size={size}
                                    fullWidth
                                    icon={selectedOption?.icon}
                                    center
                                >
                                    {selectedOption?.label ?? group[0]?.label}
                                </Button>
                            </Menu>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

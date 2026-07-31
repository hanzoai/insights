import clsx from 'clsx'
import React, { useMemo } from 'react'

import { IconX } from '@hanzo/icons'

import { DropdownProps } from 'lib/elements/Dropdown'

import { Button, ButtonProps } from '../Button'
import {
    Menu,
    MenuItem,
    MenuItemBase,
    MenuItemLeaf,
    MenuItemNode,
    MenuProps,
    MenuSection,
    isMenuSection,
} from '../Menu/Menu'
import { PopoverProps } from '../Popover'
import { TooltipProps } from '../Tooltip'

// Select options are basically menu items that handle onClick and active state internally
interface SelectOptionBase extends Omit<MenuItemBase, 'active' | 'status'> {
    /** Support this option if it already is selected, but otherwise don't allow selecting it by hiding it. */
    hidden?: boolean
}

type SelectCustomControl<T> = ({ onSelect }: { onSelect: (newValue: T) => void }) => JSX.Element
export interface SelectOptionLeaf<T> extends SelectOptionBase {
    value: T
    /**
     * Label for display inside the dropdown menu.
     *
     * If you really need something more advanced than a button, this also allows providing a custom control component,
     * which takes an `onSelect` prop. Can be for example a textarea with an "Apply value" button. Use this sparingly!
     */
    labelInMenu?: string | JSX.Element | SelectCustomControl<T>
}

export interface SelectOptionNode<T> extends SelectOptionBase {
    options: SelectOptions<T>
}

export type SelectOption<T> = SelectOptionLeaf<T> | SelectOptionNode<T>

export interface SelectSection<T> {
    title?: string | React.ReactNode
    options: SelectOption<T>[]
    footer?: string | React.ReactNode
}

export type SelectOptions<T> = SelectSection<T>[] | SelectOption<T>[]

export interface SelectPropsBase<T>
    extends Pick<
        ButtonProps,
        | 'id'
        | 'className'
        | 'loading'
        | 'fullWidth'
        | 'disabled'
        | 'disabledReason'
        | 'data-attr'
        | 'aria-label'
        | 'onClick'
        | 'tabIndex'
        | 'type'
        | 'status'
        | 'active'
        | 'tooltip'
        | 'icon'
    > {
    options: SelectOptions<T>
    /** Callback fired when a value is selected, even if it already is set. */
    onSelect?: (newValue: T) => void
    optionTooltipPlacement?: TooltipProps['placement']
    dropdownMatchSelectWidth?: boolean
    dropdownMaxContentWidth?: boolean
    dropdownPlacement?: PopoverProps['placement']
    className?: string
    placeholder?: string
    size?: ButtonProps['size']
    menu?: Pick<MenuProps, 'className' | 'closeParentPopoverOnClickInside'>
    visible?: DropdownProps['visible']
    startVisible?: DropdownProps['startVisible']
    truncateText?: { maxWidthClass: string }
}

export interface SelectPropsClearable<T> extends SelectPropsBase<T> {
    allowClear: true
    /** Should only be undefined in form fields. */
    value?: T | null
    /** Callback fired when a value different from the one currently set is selected. */
    onChange?: (newValue: T | null) => void
    renderButtonContent?: (leaf: SelectOptionLeaf<T | null> | undefined) => string | JSX.Element
}

export interface SelectPropsNonClearable<T> extends SelectPropsBase<T> {
    allowClear?: false
    /** Should only be undefined in form fields. */
    value?: T
    /** Callback fired when a value different from the one currently set is selected. */
    onChange?: (newValue: T) => void
    renderButtonContent?: (leaf: SelectOptionLeaf<T | null> | undefined) => string | JSX.Element
}

export type SelectProps<T> = SelectPropsClearable<T> | SelectPropsNonClearable<T>

export function Select<T extends string | number | boolean | null>({
    value = null,
    onChange,
    onSelect,
    options,
    placeholder = 'Select a value',
    optionTooltipPlacement,
    dropdownMatchSelectWidth = true,
    dropdownMaxContentWidth = false,
    dropdownPlacement,
    allowClear = false,
    className,
    menu,
    renderButtonContent,
    visible,
    startVisible,
    truncateText,
    ...buttonProps
}: SelectProps<T>): JSX.Element {
    const [items, allLeafOptions] = useMemo(
        () =>
            convertSelectOptionsToMenuItems(options, value, (newValue) => {
                if (newValue !== value) {
                    onChange?.(newValue)
                }
                onSelect?.(newValue)
            }),
        [options, value, onChange, onSelect]
    )

    const activeLeaf = allLeafOptions.find((o) => o.value === value)
    const isClearButtonShown = allowClear && !!value

    return (
        <Menu
            items={items}
            tooltipPlacement={optionTooltipPlacement}
            matchWidth={dropdownMatchSelectWidth}
            placement={dropdownPlacement}
            className={menu?.className}
            maxContentWidth={dropdownMaxContentWidth}
            activeItemIndex={items
                .flatMap((i) => (isMenuSection(i) ? i.items.filter(Boolean) : i))
                .findIndex((i) => (i as MenuItem).active)}
            closeParentPopoverOnClickInside={menu?.closeParentPopoverOnClickInside}
            visible={visible}
            startVisible={startVisible}
        >
            <Button
                className={clsx(className, 'Select')}
                icon={activeLeaf?.icon}
                type="secondary"
                sideAction={
                    isClearButtonShown
                        ? {
                              icon: <IconX />,
                              divider: false,
                              onClick: () => {
                                  onChange?.(null as unknown as T)
                              },
                          }
                        : null
                }
                sideIcon={
                    !isClearButtonShown
                        ? (activeLeaf?.sideIcon as never) // This is necessary to satisfy TS that sideIcon and sideAction ARE mutually exclusive in practice
                        : undefined
                }
                tooltip={activeLeaf?.tooltip}
                {...buttonProps}
            >
                <span
                    className={
                        truncateText
                            ? `block w-full overflow-hidden text-ellipsis whitespace-nowrap ${truncateText.maxWidthClass}`
                            : 'flex flex-1'
                    }
                >
                    {renderButtonContent
                        ? renderButtonContent(activeLeaf)
                        : activeLeaf
                          ? activeLeaf.label
                          : ((value ?? placeholder) as React.ReactNode)}
                </span>
            </Button>
        </Menu>
    )
}

/**
 * The select can receive `options` that are either Options or Sections.
 *
 * To simplify the implementation we box the options so that the code only deals with sections
 * and also generate a single list of options since selection is separate from display structure
 * */
function convertSelectOptionsToMenuItems<T>(
    options: SelectOptions<T>,
    activeValue: T | null,
    onSelect: NonNullable<SelectPropsBase<T>['onSelect']>
): [(MenuItem | MenuSection)[], SelectOptionLeaf<T>[]] {
    const leafOptionsAccumulator: SelectOptionLeaf<T>[] = []
    const items = options
        .map((option) => convertToMenuSingle(option, activeValue, onSelect, leafOptionsAccumulator))
        .filter(Boolean) as (MenuItem | MenuSection)[]
    return [items, leafOptionsAccumulator]
}

function convertToMenuSingle<T>(
    option: SelectOption<T> | SelectSection<T>,
    activeValue: T | null,
    onSelect: NonNullable<SelectPropsBase<T>['onSelect']>,
    acc: SelectOptionLeaf<T>[]
): MenuItem | MenuSection | null {
    if (isSelectSection(option)) {
        const { options: childOptions, ...section } = option
        const items = option.options.map((o) => convertToMenuSingle(o, activeValue, onSelect, acc)).filter(Boolean)
        if (!items.length) {
            // Add hidden options to the accumulator (by calling convertToMenuSingle), but don't show
            return null
        }
        return {
            ...section,
            items,
        } as MenuSection
    } else if (isSelectOptionNode(option)) {
        const { options: childOptions, ...node } = option
        const items = childOptions.map((o) => convertToMenuSingle(o, activeValue, onSelect, acc)).filter(Boolean)
        if (option.hidden) {
            // Add hidden options to the accumulator (by calling convertToMenuSingle), but don't show
            return null
        }
        return {
            ...node,
            active: doOptionsContainActiveValue(childOptions, activeValue),
            items,
            custom: doOptionsContainCustomControl(childOptions),
        } as MenuItemNode
    }
    acc.push(option)
    if (option.hidden) {
        // Add hidden options to the accumulator, but don't show
        return null
    }
    const { value, label, labelInMenu, ...leaf } = option
    let CustomControl: SelectCustomControl<T> | undefined
    if (typeof labelInMenu === 'function') {
        CustomControl = labelInMenu
    }
    return {
        ...leaf,
        label: CustomControl
            ? function LabelWrapped() {
                  if (!CustomControl) {
                      throw new Error('CustomControl became undefined')
                  }
                  return <CustomControl onSelect={onSelect} />
              }
            : labelInMenu || label,
        active: value === activeValue,
        onClick: () => onSelect(value),
    } as MenuItemLeaf
}

export function isSelectSection<T>(
    candidate: SelectSection<T> | SelectOption<T>
): candidate is SelectSection<T> {
    return candidate && 'options' in candidate && !('label' in candidate)
}

export function isSelectOptionNode<T>(
    candidate: SelectSection<T> | SelectOption<T>
): candidate is SelectOptionNode<T> {
    return candidate && 'options' in candidate && 'label' in candidate
}

function doOptionsContainActiveValue<T>(options: SelectOptions<T>, activeValue: T | null): boolean {
    for (const option of options) {
        if ('options' in option) {
            if (doOptionsContainActiveValue(option.options, activeValue)) {
                return true
            }
        } else if (option.value === activeValue) {
            return true
        }
    }
    return false
}

function doOptionsContainCustomControl<T>(options: SelectOptions<T>): boolean {
    for (const option of options) {
        if ('options' in option) {
            if (doOptionsContainCustomControl(option.options)) {
                return true
            }
        } else if (typeof option.labelInMenu === 'function') {
            return true
        }
    }
    return false
}

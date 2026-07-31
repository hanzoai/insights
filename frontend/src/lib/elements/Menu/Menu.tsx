import React, { FunctionComponent, ReactNode, useCallback, useMemo } from 'react'

import { KeyboardShortcut, KeyboardShortcutProps } from '~/layout/navigation-3000/components/KeyboardShortcut'

import { Button, ButtonProps } from '../Button'
import { Divider } from '../Divider'
import { Dropdown, DropdownProps } from '../Dropdown'
import { Tag } from '../Tag'
import { TooltipProps } from '../Tooltip'
import { useKeyboardNavigation } from './useKeyboardNavigation'

type KeyboardShortcut = Array<keyof KeyboardShortcutProps>

export interface MenuItemBase
    extends Pick<
        ButtonProps,
        | 'icon'
        | 'sideIcon'
        | 'sideAction'
        | 'disabledReason'
        | 'tooltip'
        | 'tooltipPlacement'
        | 'active'
        | 'status'
        | 'data-attr'
        | 'size'
    > {
    label: string | JSX.Element
    key?: React.Key
    /** @deprecated You're probably doing something wrong if you're setting per-item classes. */
    className?: string
    /** True if the item is a custom element. */
    custom?: boolean
}
export interface MenuItemNode extends MenuItemBase {
    items: (MenuItem | false | null)[]
    placement?: DropdownProps['placement']
    keyboardShortcut?: never
}

export interface MenuItemLeafCallback extends MenuItemBase {
    onClick?: (e: React.MouseEvent) => void
    items?: never
    placement?: never
    keyboardShortcut?: KeyboardShortcut
}
export interface MenuItemLeafLink extends MenuItemBase {
    onClick?: (e: React.MouseEvent) => void
    to: string
    disableClientSideRouting?: boolean
    targetBlank?: boolean
    items?: never
    placement?: never
    keyboardShortcut?: KeyboardShortcut
}

export type MenuItemLeaf = MenuItemLeafCallback | MenuItemLeafLink

export interface MenuItemCustom {
    /** A label that's a component means it will be rendered directly, and not wrapped in a button. */
    label: () => JSX.Element
    key?: React.Key
    active?: never
    items?: never
    keyboardShortcut?: never

    /** True if the item is a custom element. */
    custom?: boolean
    placement?: never
}
export type MenuItem = (MenuItemLeaf | MenuItemCustom | MenuItemNode) & {
    tag?: 'alpha' | 'beta' | 'new'
}

export interface MenuSection {
    title?: string | React.ReactNode
    key?: React.Key
    items: (MenuItem | false | null)[]
    footer?: string | React.ReactNode
}

export type MenuItems = (MenuItem | MenuSection | false | null)[]

export interface MenuProps
    extends Pick<
            DropdownProps,
            | 'placement'
            | 'fallbackPlacements'
            | 'matchWidth'
            | 'maxContentWidth'
            | 'visible'
            | 'onVisibilityChange'
            | 'closeOnClickInside'
            | 'closeParentPopoverOnClickInside'
            | 'className'
            | 'onClickOutside'
            | 'middleware'
            | 'startVisible'
        >,
        MenuOverlayProps {
    /** Must support `ref` and `onKeyDown` for keyboard navigation. */
    children: React.ReactElement
    /** Index of the active (e.g. selected) item, if there is a specific one. */
    activeItemIndex?: number
    /**
     * If focus-based keyboard navigation is disabled, you must implement your own.
     * This is for cases of purpose-specific keyboard navigation, e.g. for a command palette.
     * `activeItemIndex` will still be used, but only to visually highlight the active item.
     * @default true
     */
    focusBasedKeyboardNavigation?: boolean
}

export function Menu({
    items,
    activeItemIndex,
    tooltipPlacement,
    onVisibilityChange,
    focusBasedKeyboardNavigation = true,
    ...dropdownProps
}: MenuProps): JSX.Element {
    const { referenceRef, itemsRef } = useKeyboardNavigation<HTMLElement, HTMLButtonElement>(
        items.flatMap((item) => (item && isMenuSection(item) ? item.items : item)).length,
        activeItemIndex,
        { enabled: focusBasedKeyboardNavigation }
    )

    const _onVisibilityChange = useCallback(
        (visible: boolean) => {
            onVisibilityChange?.(visible)
            if (visible && activeItemIndex && activeItemIndex > -1) {
                // Scroll the active item into view once the menu is open (i.e. in the next tick)
                setTimeout(() => itemsRef?.current?.[activeItemIndex]?.current?.scrollIntoView({ block: 'center' }), 0)
            }
        },
        // no need to update this when itemsRef changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [onVisibilityChange, activeItemIndex]
    )

    return (
        <Dropdown
            overlay={
                <MenuOverlay
                    buttonSize={dropdownProps.buttonSize || 'small'}
                    items={items}
                    tooltipPlacement={tooltipPlacement}
                    itemsRef={itemsRef}
                />
            }
            closeOnClickInside
            referenceRef={referenceRef}
            onVisibilityChange={_onVisibilityChange}
            {...dropdownProps}
        />
    )
}

export interface MenuOverlayProps {
    items: MenuItems
    tooltipPlacement?: TooltipProps['placement']
    itemsRef?: React.RefObject<React.RefObject<HTMLButtonElement>[]>
    /** @default 'small' */
    buttonSize?: 'xsmall' | 'small' | 'medium'
}

export function MenuOverlay({
    items,
    tooltipPlacement = 'right',
    itemsRef,
    buttonSize = 'small',
}: MenuOverlayProps): JSX.Element {
    const sectionsOrItems = useMemo(() => normalizeItems(items), [items])

    return sectionsOrItems.length > 0 && isMenuSection(sectionsOrItems[0]) ? (
        <MenuSectionList
            sections={sectionsOrItems as MenuSection[]}
            buttonSize={buttonSize}
            tooltipPlacement={tooltipPlacement}
            itemsRef={itemsRef}
        />
    ) : (
        <MenuItemList
            items={sectionsOrItems as MenuItem[]}
            buttonSize={buttonSize}
            tooltipPlacement={tooltipPlacement}
            itemsRef={itemsRef}
            itemIndexOffset={0}
        />
    )
}

interface MenuSectionListProps {
    sections: MenuSection[]
    buttonSize: 'xsmall' | 'small' | 'medium'
    tooltipPlacement: TooltipProps['placement'] | undefined
    itemsRef: React.RefObject<React.RefObject<HTMLButtonElement>[]> | undefined
}

export function MenuSectionList({
    sections,
    buttonSize,
    tooltipPlacement,
    itemsRef,
}: MenuSectionListProps): JSX.Element {
    let rollingItemIndex = 0

    return (
        <ul>
            {sections.map((section, i) => {
                const sectionElement = (
                    <li key={section.key || i}>
                        <section className="deprecated-space-y-px">
                            {section.title ? (
                                typeof section.title === 'string' ? (
                                    <h5 className="mx-2 my-1">{section.title}</h5>
                                ) : (
                                    section.title
                                )
                            ) : null}
                            <MenuItemList
                                items={section.items.filter(Boolean) as MenuItem[]}
                                buttonSize={buttonSize}
                                tooltipPlacement={tooltipPlacement}
                                itemsRef={itemsRef}
                                itemIndexOffset={rollingItemIndex}
                            />
                            {section.footer ? <div>{section.footer}</div> : null}
                        </section>
                        {i < sections.length - 1 ? (
                            <Divider className={buttonSize === 'small' ? 'my-1' : 'my-2'} />
                        ) : null}
                    </li>
                )
                rollingItemIndex += section.items.length
                return sectionElement
            })}
        </ul>
    )
}

interface MenuItemListProps {
    items: MenuItem[]
    buttonSize?: 'xsmall' | 'small' | 'medium'
    tooltipPlacement?: TooltipProps['placement'] | undefined
    itemsRef?: React.RefObject<React.RefObject<HTMLButtonElement>[]> | undefined
    itemIndexOffset?: number
}

export function MenuItemList({
    items,
    buttonSize = 'small',
    itemIndexOffset = 0,
    tooltipPlacement = 'right',
    itemsRef,
}: MenuItemListProps): JSX.Element {
    return (
        <ul className="deprecated-space-y-px">
            {items.map((item, itemIndex) => (
                <li key={item.key || itemIndex}>
                    <MenuItemButton
                        item={item}
                        size={buttonSize}
                        tooltipPlacement={tooltipPlacement}
                        ref={itemsRef?.current?.[itemIndexOffset + itemIndex]}
                        tag={item.tag}
                        active={item.active}
                    />
                </li>
            ))}
        </ul>
    )
}

interface MenuItemButtonProps {
    item: MenuItem
    size: 'xsmall' | 'small' | 'medium'
    tooltipPlacement: TooltipProps['placement'] | undefined
    tag?: 'alpha' | 'beta' | 'new'
    active?: boolean
}

const MenuItemButton: FunctionComponent<MenuItemButtonProps & React.RefAttributes<HTMLButtonElement>> =
    React.forwardRef(
        (
            {
                item: { label, items, placement, keyboardShortcut, tag, custom, ...buttonProps },
                size,
                tooltipPlacement,
                active,
            },
            ref
        ): JSX.Element => {
            const Label = typeof label === 'function' ? label : null
            const button = Label ? (
                <Label key="x" />
            ) : (
                // @ts-expect-error - We don't have a type-level guarantee that `sideAction` won't be present
                // alongside `sideIcon` in one menu item, but that's fine. It'd be horribly complex to implement here.
                <Button
                    ref={ref}
                    tooltipPlacement={tooltipPlacement}
                    fullWidth
                    role="menuitem"
                    size={size}
                    {...buttonProps}
                    active={active}
                >
                    {label as ReactNode}
                    {keyboardShortcut && (
                        <div className="-mr-0.5 inline-flex grow justify-end">
                            {/* Show the keyboard shortcut on the right */}
                            <KeyboardShortcut {...Object.fromEntries(keyboardShortcut.map((key) => [key, true]))} />
                        </div>
                    )}
                    {tag && (
                        <Tag
                            type={tag === 'alpha' ? 'completion' : tag === 'beta' ? 'warning' : 'success'}
                            size="small"
                            className="ml-2"
                        >
                            {tag.toUpperCase()}
                        </Tag>
                    )}
                </Button>
            )

            return items ? (
                <Menu
                    items={items}
                    tooltipPlacement={tooltipPlacement}
                    placement={placement || 'right-start'}
                    closeOnClickInside={!custom}
                    closeParentPopoverOnClickInside={!custom}
                    buttonSize={size}
                >
                    {button}
                </Menu>
            ) : (
                button
            )
        }
    )
MenuItemButton.displayName = 'MenuItemButton'

function normalizeItems(sectionsAndItems: MenuItems): MenuItem[] | MenuSection[] {
    const sections: MenuSection[] = []
    let implicitSection: MenuSection = { items: [] }
    for (const sectionOrItem of sectionsAndItems) {
        if (!sectionOrItem) {
            continue // Ignore falsy items
        }
        if (isMenuSection(sectionOrItem)) {
            if (implicitSection.items.length > 0) {
                sections.push(implicitSection)
                implicitSection = { items: [] }
            }
            sections.push(sectionOrItem)
        } else {
            implicitSection.items.push(sectionOrItem)
        }
    }
    if (implicitSection.items.length > 0) {
        sections.push(implicitSection)
    }

    if (sections.length === 1 && !sections[0].title && !sections[0].footer) {
        return sections[0].items.filter(Boolean) as MenuItem[]
    }
    return sections
}

export function isMenuSection(candidate: MenuSection | MenuItem): candidate is MenuSection {
    return candidate && 'items' in candidate && !('label' in candidate)
}

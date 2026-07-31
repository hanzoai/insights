import './Collapse.scss'

import clsx from 'clsx'
import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { Transition } from 'react-transition-group'
import { ENTERED, ENTERING } from 'react-transition-group/Transition'
import useResizeObserver from 'use-resize-observer'

import { IconCollapse, IconExpand } from '@hanzo/icons'

import { Button, ButtonProps } from '../Button'

export interface CollapsePanel<K extends React.Key> {
    key: K
    header: ReactNode | ButtonProps
    content: ReactNode
    dataAttr?: string
    className?: string
}

interface CollapsePropsBase<K extends React.Key> {
    /** Panels in order of display. Falsy values mean that the panel isn't rendered. */
    panels: (CollapsePanel<K> | null | false)[]
    className?: string
    size?: ButtonProps['size']
    embedded?: boolean
}

interface CollapsePropsSingle<K extends React.Key> extends CollapsePropsBase<K> {
    activeKey?: K
    defaultActiveKey?: K
    onChange?: (activeKey: K | null) => void
    multiple?: false
}

interface CollapsePropsMultiple<K extends React.Key> extends CollapsePropsBase<K> {
    activeKeys?: K[]
    defaultActiveKeys?: K[]
    onChange?: (activeKeys: K[]) => void
    multiple: true
}

type CollapseProps<K extends React.Key> = CollapsePropsSingle<K> | CollapsePropsMultiple<K>

export function Collapse<K extends React.Key>({
    panels,
    className,
    size,
    embedded,
    ...props
}: CollapseProps<K>): JSX.Element {
    let isPanelExpanded: (key: K) => boolean
    let onPanelChange: (key: K, isExpanded: boolean) => void
    if (props.multiple) {
        const defaultActiveKeys = props.defaultActiveKeys ?? []
        const defaultActiveKeysString = defaultActiveKeys.join(',')
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [localActiveKeys, setLocalActiveKeys] = useState<Set<K>>(new Set(defaultActiveKeys))
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            setLocalActiveKeys(new Set(defaultActiveKeys))
        }, [defaultActiveKeysString])
        const effectiveActiveKeys = props.activeKeys ? new Set(props.activeKeys) : localActiveKeys
        isPanelExpanded = (key: K) => effectiveActiveKeys.has(key)
        onPanelChange = (key: K, isExpanded: boolean): void => {
            const newActiveKeys = new Set(effectiveActiveKeys)
            if (isExpanded) {
                newActiveKeys.add(key)
            } else {
                newActiveKeys.delete(key)
            }
            props.onChange?.(Array.from(newActiveKeys))
            setLocalActiveKeys(newActiveKeys)
        }
    } else {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [localActiveKey, setLocalActiveKey] = useState<K | null>(props.defaultActiveKey ?? null)
        const effectiveActiveKey = props.activeKey ?? localActiveKey
        isPanelExpanded = (key: K) => key === effectiveActiveKey
        onPanelChange = (key: K, isExpanded: boolean): void => {
            props.onChange?.(isExpanded ? key : null)
            setLocalActiveKey(isExpanded ? key : null)
        }
    }

    const displayPanels = panels.filter(Boolean) as CollapsePanel<K>[]
    const hasExpandablePanels = displayPanels.some((p) => !!p.content)

    return (
        <div className={clsx('Collapse', embedded && 'Collapse--embedded', className)}>
            {displayPanels.map(({ key, ...panel }) => (
                <CollapsePanel
                    key={key}
                    {...panel}
                    size={size}
                    isExpanded={isPanelExpanded(key)}
                    indexUnexpanableHeader={hasExpandablePanels}
                    onChange={(isExanded) => onPanelChange(key, isExanded)}
                />
            ))}
        </div>
    )
}

interface CollapsePanelProps {
    header: ReactNode | ButtonProps
    content: ReactNode
    isExpanded: boolean
    indexUnexpanableHeader: boolean
    size: ButtonProps['size']
    onChange: (isExpanded: boolean) => void
    className?: string
    dataAttr?: string
    onHeaderClick?: () => void
}

interface HeaderDefinition {
    headerChildren: ReactNode
    headerProps: ButtonProps
}

function CollapsePanel({
    header,
    content,
    isExpanded,
    size,
    className,
    dataAttr,
    indexUnexpanableHeader,
    onChange,
    onHeaderClick,
}: CollapsePanelProps): JSX.Element {
    const { height: contentHeight, ref: contentRef } = useResizeObserver({ box: 'border-box' })

    const { headerChildren, headerProps } = useMemo((): HeaderDefinition => {
        if (header && typeof header === 'object' && 'children' in header) {
            const { children, ...rest } = header as ButtonProps
            return { headerChildren: children, headerProps: rest }
        }

        return { headerChildren: header as ReactNode, headerProps: {} }
    }, [header])

    return (
        <div className="CollapsePanel" aria-expanded={isExpanded}>
            {content ? (
                <Button
                    {...headerProps}
                    fullWidth
                    className={clsx('CollapsePanel__header', headerProps?.className)}
                    onClick={(e) => {
                        onHeaderClick && onHeaderClick()
                        onChange(!isExpanded)
                        headerProps.onClick?.(e)
                        e.stopPropagation()
                    }}
                    icon={isExpanded ? <IconCollapse /> : <IconExpand />}
                    {...(dataAttr ? { 'data-attr': dataAttr } : {})}
                    size={size}
                >
                    {headerChildren}
                </Button>
            ) : (
                <Button
                    className="CollapsePanel__header CollapsePanel__header--disabled"
                    {...(dataAttr ? { 'data-attr': dataAttr } : {})}
                    size={size}
                    icon={indexUnexpanableHeader ? <div className="w-[1em] h-[1em]" /> : null}
                >
                    {headerChildren}
                </Button>
            )}

            <Transition in={isExpanded} timeout={200} mountOnEnter unmountOnExit>
                {(status) => (
                    <div
                        className="CollapsePanel__body"
                        // eslint-disable-next-line react/forbid-dom-props
                        style={
                            status === ENTERING || status === ENTERED
                                ? {
                                      height: contentHeight,
                                  }
                                : undefined
                        }
                        aria-busy={status.endsWith('ing')}
                    >
                        <div className={clsx('CollapsePanel__content', className)} ref={contentRef}>
                            {content}
                        </div>
                    </div>
                )}
            </Transition>
        </div>
    )
}

Collapse.Panel = CollapsePanel

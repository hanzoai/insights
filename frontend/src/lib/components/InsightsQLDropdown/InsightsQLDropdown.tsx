import clsx from 'clsx'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { Button, Dropdown } from '@hanzo/elements'

import { NodeKind } from '~/queries/schema/schema-general'
import { escapeDottedInsightsQLIdentifier } from '~/queries/utils'

import { InsightsQLEditor } from '../InsightsQLEditor/InsightsQLEditor'

export const InsightsQLDropdown = ({
    hogQLValue,
    onInsightsQLValueChange,
    tableName,
    hogQLEditorPlaceholder,
    className = '',
    size,
    connectionId,
    buttonIcon,
    buttonLabel,
    buttonTooltip,
    buttonAriaLabel,
    visible,
    onVisibilityChange,
}: {
    hogQLValue: string
    tableName: string
    connectionId?: string
    className?: string
    hogQLEditorPlaceholder?: string
    size?: 'small' | 'medium'
    buttonIcon?: JSX.Element
    buttonLabel?: ReactNode
    buttonTooltip?: string
    buttonAriaLabel?: string
    visible?: boolean
    onVisibilityChange?: (visible: boolean) => void
    onInsightsQLValueChange: (hogQLValue: string) => void
}): JSX.Element => {
    const [internalVisibility, setInternalVisibility] = useState(false)
    const isInsightsQLDropdownVisible = visible ?? internalVisibility
    const setIsInsightsQLDropdownVisible = (nextVisibility: boolean): void => {
        setInternalVisibility(nextVisibility)
        onVisibilityChange?.(nextVisibility)
    }

    return (
        <div className={clsx('flex-auto min-w-0', className)}>
            <Dropdown
                visible={isInsightsQLDropdownVisible}
                closeOnClickInside={false}
                onClickOutside={() => setIsInsightsQLDropdownVisible(false)}
                overlay={
                    // eslint-disable-next-line react/forbid-dom-props
                    <div className="w-120" style={{ maxWidth: 'max(60vw, 20rem)' }}>
                        <InsightsQLEditor
                            value={hogQLValue}
                            metadataSource={{
                                kind: NodeKind.InsightsQLQuery,
                                query: `SELECT * FROM ${escapeDottedInsightsQLIdentifier(tableName)}`,
                                connectionId,
                            }}
                            onChange={(currentValue) => {
                                onInsightsQLValueChange(currentValue)
                                setIsInsightsQLDropdownVisible(false)
                            }}
                            placeholder={hogQLEditorPlaceholder}
                        />
                    </div>
                }
            >
                <Button
                    fullWidth
                    type="secondary"
                    size={size}
                    icon={buttonIcon}
                    tooltip={buttonTooltip}
                    aria-label={buttonAriaLabel}
                    onClick={() => setIsInsightsQLDropdownVisible(!isInsightsQLDropdownVisible)}
                >
                    {buttonLabel ?? <code>{hogQLValue}</code>}
                </Button>
            </Dropdown>
        </div>
    )
}

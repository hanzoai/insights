import clsx from 'clsx'
import { useState } from 'react'

import { Button, Dropdown } from '@hanzo/elements'

import { NodeKind } from '~/queries/schema/schema-general'

import { InsightsQLEditor } from '../InsightsQLEditor/InsightsQLEditor'

export const InsightsQLDropdown = ({
    hogQLValue,
    onInsightsQLValueChange,
    tableName,
    hogQLEditorPlaceholder,
    className = '',
    size,
}: {
    hogQLValue: string
    tableName: string
    className?: string
    hogQLEditorPlaceholder?: string
    size?: 'small' | 'medium'
    onInsightsQLValueChange: (hogQLValue: string) => void
}): JSX.Element => {
    const [isInsightsQLDropdownVisible, setIsInsightsQLDropdownVisible] = useState(false)

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
                            metadataSource={{ kind: NodeKind.InsightsQLQuery, query: `SELECT * FROM ${tableName}` }}
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
                    onClick={() => setIsInsightsQLDropdownVisible(!isInsightsQLDropdownVisible)}
                >
                    <code>{hogQLValue}</code>
                </Button>
            </Dropdown>
        </div>
    )
}

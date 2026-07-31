import clsx from 'clsx'
import { useState } from 'react'

import { Button, Dropdown } from '@hanzo/elements'

import { NodeKind } from '~/queries/schema/schema-general'

import { InsightsQLEditor } from '../InsightsQLEditor/InsightsQLEditor'

export const InsightsQLDropdown = ({
    insightsQLValue,
    onInsightsQLValueChange,
    tableName,
    insightsQLEditorPlaceholder,
    className = '',
}: {
    insightsQLValue: string
    tableName: string
    className?: string
    insightsQLEditorPlaceholder?: string
    onInsightsQLValueChange: (insightsQLValue: string) => void
}): JSX.Element => {
    const [isInsightsQLDropdownVisible, setIsInsightsQLDropdownVisible] = useState(false)

    return (
        <div className={clsx('flex-auto overflow-hidden', className)}>
            <Dropdown
                visible={isInsightsQLDropdownVisible}
                closeOnClickInside={false}
                onClickOutside={() => setIsInsightsQLDropdownVisible(false)}
                overlay={
                    // eslint-disable-next-line react/forbid-dom-props
                    <div className="w-120" style={{ maxWidth: 'max(60vw, 20rem)' }}>
                        <InsightsQLEditor
                            value={insightsQLValue}
                            metadataSource={{ kind: NodeKind.InsightsQLQuery, query: `SELECT * FROM ${tableName}` }}
                            onChange={(currentValue) => {
                                onInsightsQLValueChange(currentValue)
                                setIsInsightsQLDropdownVisible(false)
                            }}
                            placeholder={insightsQLEditorPlaceholder}
                        />
                    </div>
                }
            >
                <Button
                    fullWidth
                    type="secondary"
                    onClick={() => setIsInsightsQLDropdownVisible(!isInsightsQLDropdownVisible)}
                >
                    <code>{insightsQLValue}</code>
                </Button>
            </Dropdown>
        </div>
    )
}

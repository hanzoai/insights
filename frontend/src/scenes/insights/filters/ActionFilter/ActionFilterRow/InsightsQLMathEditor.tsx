import { useState } from 'react'

import { InsightsQLEditor } from 'lib/components/InsightsQLEditor/InsightsQLEditor'
import { Button } from 'lib/elements/Button'
import { Dropdown } from 'lib/elements/Dropdown'

interface InsightsQLMathEditorDropdownProps {
    mathInsightsQL: string | null | undefined
    index: number
    onMathInsightsQLSelect: (index: number, insightsql: string) => void
}

export function InsightsQLMathEditorDropdown({
    mathInsightsQL,
    index,
    onMathInsightsQLSelect,
}: InsightsQLMathEditorDropdownProps): JSX.Element {
    const [isVisible, setIsVisible] = useState(false)

    return (
        <div className="flex-auto min-w-0">
            <Dropdown
                visible={isVisible}
                closeOnClickInside={false}
                onClickOutside={() => setIsVisible(false)}
                overlay={
                    // eslint-disable-next-line react/forbid-dom-props
                    <div className="w-120" style={{ maxWidth: 'max(60vw, 20rem)' }}>
                        <InsightsQLEditor
                            value={mathInsightsQL}
                            onChange={(currentValue) => {
                                onMathInsightsQLSelect(index, currentValue)
                                setIsVisible(false)
                            }}
                        />
                    </div>
                }
            >
                <Button
                    fullWidth
                    type="secondary"
                    data-attr={`math-insightsql-select-${index}`}
                    onClick={() => setIsVisible(!isVisible)}
                >
                    <code>{mathInsightsQL}</code>
                </Button>
            </Dropdown>
        </div>
    )
}

import { Tag } from 'lib/elements/Tag'
import { Tooltip } from 'lib/elements/Tooltip'

import { FeatureFlagStatus, FeatureFlagStatusResponse } from '~/types'

export function FeatureFlagStatusIndicator({
    flagStatus,
}: {
    flagStatus: FeatureFlagStatusResponse | null
}): JSX.Element | null {
    if (!flagStatus || flagStatus.status !== FeatureFlagStatus.STALE) {
        return null
    }

    return (
        <Tooltip
            title={
                <>
                    <div className="text-sm">{flagStatus.reason}</div>
                    <div className="text-xs">
                        Make sure to remove any references to this flag in your code before deleting it.
                    </div>
                </>
            }
            placement="right"
        >
            <span>
                <Tag type="warning" className="uppercase cursor-default">
                    {flagStatus.status}
                </Tag>
            </span>
        </Tooltip>
    )
}

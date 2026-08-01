import { useActions, useValues } from 'kea'
import { useEffect, useState } from 'react'

import { Button } from '@hanzo/elements'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { InputSelect } from 'lib/elements/InputSelect/InputSelect'
import { Skeleton } from 'lib/elements/Skeleton'
import { objectsEqual } from 'lib/utils/objects'

import { DEFAULT_LOGS_DISTINCT_ID_ATTRIBUTE_KEYS, logsConfigLogic } from 'products/logs/frontend/logsConfigLogic'

export function LogsDistinctIdAttributeKeys(): JSX.Element {
    const { logsConfig, logsConfigLoading } = useValues(logsConfigLogic)
    const { updateLogsConfig } = useActions(logsConfigLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    const [value, setValue] = useState<string[]>([])

    useEffect(() => {
        if (logsConfig) {
            setValue(logsConfig.logs_distinct_id_attribute_keys ?? DEFAULT_LOGS_DISTINCT_ID_ATTRIBUTE_KEYS)
        }
    }, [logsConfig])

    if (!logsConfig && logsConfigLoading) {
        return <Skeleton className="w-1/2 h-4" />
    }

    const cleaned = value.map((key) => key.trim()).filter(Boolean)
    const isDirty = !objectsEqual(cleaned, logsConfig?.logs_distinct_id_attribute_keys ?? [])
    const isEmpty = cleaned.length === 0

    return (
        <div className="deprecated-space-y-4">
            <InputSelect
                mode="multiple"
                allowCustomValues
                value={value}
                onChange={setValue}
                placeholder={DEFAULT_LOGS_DISTINCT_ID_ATTRIBUTE_KEYS.join(', ')}
                loading={logsConfigLoading}
                disabled={logsConfigLoading || !!restrictedReason}
                data-attr="logs-distinct-id-attribute-keys-select"
                className="max-w-md"
            />
            <Button
                type="primary"
                onClick={() => updateLogsConfig({ logs_distinct_id_attribute_keys: cleaned })}
                disabledReason={
                    restrictedReason ||
                    (isEmpty ? 'At least one attribute key is required' : !isDirty ? 'No changes to save' : undefined)
                }
                loading={logsConfigLoading}
            >
                Save
            </Button>
        </div>
    )
}

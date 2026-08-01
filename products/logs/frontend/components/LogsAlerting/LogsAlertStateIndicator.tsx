import { Tag, TagType } from '@hanzo/elements'

import { TZLabel } from 'lib/components/TZLabel'
import { Tooltip } from 'lib/elements/Tooltip'

import { LogsAlertConfigurationStateEnumApi } from 'products/logs/frontend/generated/api.schemas'

const STATE_CONFIG: Record<LogsAlertConfigurationStateEnumApi, { label: string; type: TagType }> = {
    [LogsAlertConfigurationStateEnumApi.NotFiring]: { label: 'OK', type: 'success' },
    [LogsAlertConfigurationStateEnumApi.Firing]: { label: 'Firing', type: 'danger' },
    [LogsAlertConfigurationStateEnumApi.PendingResolve]: { label: 'Resolving', type: 'warning' },
    [LogsAlertConfigurationStateEnumApi.Errored]: { label: 'Errored', type: 'danger' },
    [LogsAlertConfigurationStateEnumApi.Snoozed]: { label: 'Snoozed', type: 'muted' },
    [LogsAlertConfigurationStateEnumApi.Broken]: { label: 'Broken', type: 'danger' },
}

const STATES_WITH_ERROR_TOOLTIP = new Set<LogsAlertConfigurationStateEnumApi>([
    LogsAlertConfigurationStateEnumApi.Errored,
    LogsAlertConfigurationStateEnumApi.Broken,
])

export function LogsAlertStateIndicator({
    state,
    enabled = true,
    firstEnabledAt = null,
    lastErrorMessage,
    snoozeUntil,
}: {
    state: LogsAlertConfigurationStateEnumApi
    enabled?: boolean
    firstEnabledAt?: string | null
    lastErrorMessage?: string | null
    snoozeUntil?: string | null
}): JSX.Element {
    if (!enabled) {
        if (firstEnabledAt == null) {
            return (
                <Tag type="warning" data-attr="logs-alert-state-draft">
                    Draft
                </Tag>
            )
        }
        return (
            <Tag type="muted" data-attr="logs-alert-state-disabled">
                Disabled
            </Tag>
        )
    }
    const config = STATE_CONFIG[state] ?? { label: state, type: 'default' as TagType }
    const tag = (
        <Tag type={config.type} data-attr={`logs-alert-state-${state}`}>
            {config.label}
        </Tag>
    )
    if (lastErrorMessage && STATES_WITH_ERROR_TOOLTIP.has(state)) {
        return <Tooltip title={lastErrorMessage}>{tag}</Tooltip>
    }
    if (state === LogsAlertConfigurationStateEnumApi.Snoozed && snoozeUntil) {
        return (
            <Tooltip
                title={
                    <>
                        Until <TZLabel time={snoozeUntil} />
                    </>
                }
            >
                {tag}
            </Tooltip>
        )
    }
    return tag
}

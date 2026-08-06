import { useActions, useValues } from 'kea'
import insights from 'insights-js'

import { IconList } from '@hanzo/icons'
import { Button, Menu } from '@hanzo/elements'

import { logsConfigLogic } from 'products/logs/frontend/logsConfigLogic'
import { ParsedLogMessage } from 'products/logs/frontend/types'

import { logDetailsModalLogic } from '../LogDetailsModal/logDetailsModalLogic'
import { logsViewerModalLogic } from '../LogsViewerModal/logsViewerModalLogic'
import { buildContextFilters, getAvailableContexts } from './logContextUtils'

interface LogContextSelectorProps {
    log: ParsedLogMessage
    size?: 'xsmall' | 'small'
    noPadding?: boolean
}

export function LogContextSelector({ log, size = 'xsmall', noPadding }: LogContextSelectorProps): JSX.Element | null {
    const { openLogsViewerModal } = useActions(logsViewerModalLogic)
    const { closeLogDetails } = useActions(logDetailsModalLogic)
    const { configuredSessionIdKeys } = useValues(logsConfigLogic)

    const contexts = getAvailableContexts(log, configuredSessionIdKeys)
    if (contexts.length === 0) {
        return null
    }

    return (
        <Menu
            items={contexts.map((ctx) => ({
                label: ctx.label,
                tooltip: ctx.description,
                onClick: () => {
                    insights.capture('logs context viewed', { context_type: ctx.type })
                    closeLogDetails()
                    const filters = buildContextFilters(log, ctx.type, configuredSessionIdKeys)
                    openLogsViewerModal({
                        id: `context-${log.uuid}-${ctx.type}`,
                        fullScreen: false,
                        initialFilters: filters,
                    })
                },
            }))}
        >
            <Button
                size={size}
                icon={<IconList />}
                tooltip="View in context"
                aria-label="View in context"
                noPadding={noPadding ?? size === 'xsmall'}
                className="text-muted"
                data-attr="logs-viewer-context-selector"
            />
        </Menu>
    )
}

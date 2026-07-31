import { useActions, useValues } from 'kea'

import { Checkbox, SegmentedButton } from '@hanzo/elements'

import { humanFriendlyNumber } from 'lib/utils'

import { KeyboardShortcut } from '~/layout/navigation-3000/components/KeyboardShortcut'

import { LogsOrderBy } from 'products/logs/frontend/types'

import { LogsExportMenu } from './LogsExportMenu'
import { TimezoneSelect } from './TimezoneSelect'
import { logsViewerLogic } from './logsViewerLogic'

export interface LogsViewerToolbarProps {
    totalLogsCount?: number
    orderBy: LogsOrderBy
    onChangeOrderBy: (orderBy: LogsOrderBy) => void
}

export const LogsViewerToolbar = ({
    totalLogsCount,
    orderBy,
    onChangeOrderBy,
}: LogsViewerToolbarProps): JSX.Element => {
    const { wrapBody, prettifyJson, timezone } = useValues(logsViewerLogic)
    const { setWrapBody, setPrettifyJson, setTimezone } = useActions(logsViewerLogic)

    return (
        <div className="flex justify-between flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
                <SegmentedButton
                    value={orderBy}
                    onChange={onChangeOrderBy}
                    options={[
                        {
                            value: 'earliest',
                            label: 'Earliest',
                        },
                        {
                            value: 'latest',
                            label: 'Latest',
                        },
                    ]}
                    size="small"
                />
                <Checkbox checked={wrapBody} bordered onChange={setWrapBody} label="Wrap message" size="small" />
                <Checkbox
                    checked={prettifyJson}
                    bordered
                    onChange={setPrettifyJson}
                    label="Prettify JSON"
                    size="small"
                />
                <TimezoneSelect value={timezone} onChange={setTimezone} size="small" />
                <LogsExportMenu totalLogsCount={totalLogsCount} />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
                {totalLogsCount !== undefined && totalLogsCount > 0 && (
                    <span className="text-muted text-xs">{humanFriendlyNumber(totalLogsCount)} logs</span>
                )}
                <span className="text-muted text-xs flex items-center gap-1">
                    <KeyboardShortcut arrowup />
                    <KeyboardShortcut arrowdown />
                    or
                    <KeyboardShortcut j />
                    <KeyboardShortcut k />
                    navigate
                    <span className="mx-1">·</span>
                    <KeyboardShortcut enter />
                    expand
                    <span className="mx-1">·</span>
                    <KeyboardShortcut p />
                    prettify
                    <span className="mx-1">·</span>
                    <KeyboardShortcut r />
                    refresh
                </span>
            </div>
        </div>
    )
}

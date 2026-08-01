import { useActions, useValues } from 'kea'

import { IconDownload } from '@hanzo/icons'
import { Button, Menu } from '@hanzo/elements'

import { humanFriendlyNumber } from 'lib/utils/numbers'

import { logsExportLogic } from './logsExportLogic'
import { logsViewerLogic } from './logsViewerLogic'

interface LogsExportMenuProps {
    totalLogsCount?: number
}

export const LogsExportMenu = ({ totalLogsCount }: LogsExportMenuProps): JSX.Element => {
    const { selectedCount } = useValues(logsViewerLogic)
    const { exportServerSide, exportSelectedAsCsv, copySelectedLogs } = useActions(logsExportLogic)
    const { maxExportableLogs } = useValues(logsExportLogic)

    return (
        <Menu
            items={[
                ...(selectedCount > 0
                    ? [
                          {
                              title: `Selected logs (${humanFriendlyNumber(selectedCount)})`,
                              items: [
                                  { label: 'Copy to clipboard', onClick: copySelectedLogs },
                                  { label: 'Export as CSV', onClick: exportSelectedAsCsv },
                              ],
                          },
                      ]
                    : []),
                {
                    title: totalLogsCount
                        ? `All matching logs (${humanFriendlyNumber(totalLogsCount)})`
                        : 'All matching logs',
                    items: [
                        {
                            label: 'Export as CSV',
                            onClick: () => exportServerSide(totalLogsCount),
                            disabledReason:
                                totalLogsCount && totalLogsCount > maxExportableLogs
                                    ? `Too many logs (${humanFriendlyNumber(totalLogsCount)}). Narrow your filters to under ${humanFriendlyNumber(maxExportableLogs)}.`
                                    : undefined,
                        },
                    ],
                },
            ]}
        >
            <Button size="small" type="secondary" icon={<IconDownload />} tooltip="Export logs" />
        </Menu>
    )
}

import { useActions, useValues } from 'kea'

import { IconDownload } from '@hanzo/icons'
import { Button, Dropdown } from '@hanzo/elements'

import { BasicFiltersTab } from './BasicFiltersTab'
import { advancedActivityLogsLogic } from './advancedActivityLogsLogic'

export function AdvancedActivityLogFiltersPanel(): JSX.Element {
    const { hasActiveFilters, exportsLoading } = useValues(advancedActivityLogsLogic)
    const { clearAllFilters, exportLogs } = useActions(advancedActivityLogsLogic)

    return (
        <div className="border rounded-md p-4 bg-bg-light">
            <div className="flex items-center justify-end">
                <div className="flex gap-2">
                    <Dropdown
                        overlay={
                            <div className="space-y-1 p-1">
                                <Button
                                    size="small"
                                    fullWidth
                                    onClick={() => exportLogs('csv')}
                                    loading={exportsLoading}
                                    data-attr="audit-logs-export-csv"
                                >
                                    Export as CSV
                                </Button>
                                <Button
                                    size="small"
                                    fullWidth
                                    onClick={() => exportLogs('xlsx')}
                                    loading={exportsLoading}
                                    data-attr="audit-logs-export-xlsx"
                                >
                                    Export as Excel
                                </Button>
                            </div>
                        }
                        placement="bottom-end"
                        data-attr="audit-logs-export-dropdown"
                    >
                        <Button
                            size="small"
                            type="secondary"
                            icon={<IconDownload />}
                            data-attr="audit-logs-export-button"
                        >
                            Export
                        </Button>
                    </Dropdown>
                    <Button
                        size="small"
                        type="secondary"
                        disabledReason={!hasActiveFilters ? 'No active filters' : undefined}
                        onClick={clearAllFilters}
                        data-attr="audit-logs-clear-filters"
                    >
                        Clear all
                    </Button>
                </div>
            </div>

            <BasicFiltersTab />
        </div>
    )
}

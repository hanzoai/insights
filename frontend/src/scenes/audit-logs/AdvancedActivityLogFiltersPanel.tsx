import { useActions, useValues } from 'kea'

import { IconDownload } from '@hanzo/icons'
import { Button, Dropdown } from '@hanzo/elements'

import { ActivityLogSubscribeMenu } from 'lib/components/ActivityLog/ActivityLogSubscribeMenu'
import { FEATURE_FLAGS } from 'lib/constants'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'

import { advancedActivityFiltersToHogProperties } from './advancedActivityFilterTranslation'
import { advancedActivityLogsLogic } from './advancedActivityLogsLogic'
import { BasicFiltersTab } from './BasicFiltersTab'

export function AdvancedActivityLogFiltersPanel(): JSX.Element {
    const { hasActiveFilters, exportsLoading, filters, isOrganizationView } = useValues(advancedActivityLogsLogic)
    const { clearAllFilters, exportLogs } = useActions(advancedActivityLogsLogic)
    const { featureFlags } = useValues(featureFlagLogic)

    const { properties: subscribeProperties } = advancedActivityFiltersToHogProperties(filters)

    return (
        <div className="border rounded-md p-4 bg-bg-light">
            <div className="flex items-center justify-end">
                <div className="flex gap-2">
                    {!isOrganizationView && (
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
                    )}
                    {!isOrganizationView && featureFlags[FEATURE_FLAGS.CDP_ACTIVITY_LOG_NOTIFICATIONS] && (
                        <ActivityLogSubscribeMenu
                            properties={subscribeProperties}
                            data-attr="audit-logs-subscribe-button"
                        />
                    )}
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

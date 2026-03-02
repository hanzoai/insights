import { BindLogic, useActions, useValues } from 'kea'
import { router } from 'kea-router'
import { useCallback, useMemo } from 'react'

import { IconBell } from '@posthog/icons'
import {
    LemonBadge,
    LemonButton,
    LemonCheckbox,
    LemonInput,
    LemonTable,
    LemonTableColumn,
    LemonTag,
    Link,
    Tooltip,
} from '@posthog/lemon-ui'

import { AppMetricsSparkline } from 'lib/components/AppMetrics/AppMetricsSparkline'
import { MemberSelect } from 'lib/components/MemberSelect'
import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { More } from 'lib/lemon-ui/LemonButton/More'
import { LemonMenuOverlay } from 'lib/lemon-ui/LemonMenu/LemonMenu'
import { LemonTableLink } from 'lib/lemon-ui/LemonTable/LemonTableLink'
import { updatedAtColumn } from 'lib/lemon-ui/LemonTable/columnUtils'
import { ProfilePicture } from 'lib/lemon-ui/ProfilePicture'
import { urls } from 'scenes/urls'

import { CustomFunctionConfigurationContextId, CustomFunctionType } from '~/types'

import { CustomFunctionIcon } from '../configuration/CustomFunctionIcon'
import { humanizeCustomFunctionType } from '../custom-function-utils'
import { CustomFunctionStatusIndicator } from '../misc/CustomFunctionStatusIndicator'
import { eventToCustomFunctionContextId } from '../sub-templates/sub-templates'
import { CustomFunctionOrderModal } from './CustomFunctionOrderModal'
import { customFunctionRequestModalLogic } from './customFunctionRequestModalLogic'
import { CustomFunctionListLogicProps, customFunctionsListLogic } from './customFunctionsListLogic'

const INTERNAL_DESTINATION_CONTEXT: Partial<
    Record<CustomFunctionConfigurationContextId, { label: string; url?: string }>
> = {
    'activity-log': {
        label: 'Activity log',
        url: urls.settings('environment-activity-logs', 'activity-log-notifications'),
    },
    'discussion-mention': {
        label: 'Discussions',
        url: urls.settings('environment-discussions', 'discussion-mention-integrations'),
    },
    'error-tracking': {
        label: 'Error tracking',
        url: urls.errorTrackingConfiguration() + '#selectedSetting=error-tracking-alerting',
    },
    'insight-alerts': { label: 'Insight alerts' },
}

function NotificationContextTag({ customFunction }: { customFunction: CustomFunctionType }): JSX.Element | null {
    const eventId = customFunction.filters?.events?.[0]?.id
    const contextId = eventToCustomFunctionContextId(eventId)
    const context = INTERNAL_DESTINATION_CONTEXT[contextId]
    if (!context) {
        return null
    }

    const tooltipTitle = context.url
        ? `Notification managed in ${context.label} settings. Click to go there.`
        : `Notification managed in ${context.label} settings.`

    return (
        <Tooltip title={tooltipTitle}>
            <LemonTag
                size="small"
                type="muted"
                icon={<IconBell />}
                onClick={
                    context.url
                        ? (e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              router.actions.push(context.url!)
                          }
                        : undefined
                }
                className={
                    context.url ? 'cursor-pointer hover:bg-fill-button-tertiary-hover transition-colors' : undefined
                }
            >
                {context.label}
            </LemonTag>
        </Tooltip>
    )
}

const urlForCustomFunction = (customFunction: CustomFunctionType): string => {
    if (customFunction.id.startsWith('plugin-')) {
        return urls.legacyPlugin(customFunction.id.replace('plugin-', ''))
    }
    if (customFunction.id.startsWith('batch-export-')) {
        return urls.batchExport(customFunction.id.replace('batch-export-', ''))
    }
    return urls.customFunction(customFunction.id)
}

export function CustomFunctionList({
    extraControls,
    hideFeedback = false,
    emptyText,
    ...props
}: CustomFunctionListLogicProps & {
    extraControls?: JSX.Element
    hideFeedback?: boolean
    emptyText?: string
}): JSX.Element {
    const { loading, filteredCustomFunctions, filters, customFunctions, hiddenCustomFunctions } = useValues(
        customFunctionsListLogic(props)
    )
    const { loadCustomFunctions, setFilters, resetFilters, toggleEnabled, deleteCustomFunction, setReorderModalOpen } =
        useActions(customFunctionsListLogic(props))

    const { openFeedbackDialog } = useActions(customFunctionRequestModalLogic)

    const humanizedType = humanizeCustomFunctionType(props.type)

    useOnMountEffect(loadCustomFunctions)

    const isManualFunction = useCallback(
        (customFunction: CustomFunctionType): boolean => {
            return props.manualFunctions?.find((f) => f.id === customFunction.id) !== undefined
        },
        [props.manualFunctions]
    )

    const columns = useMemo(() => {
        const columns: LemonTableColumn<CustomFunctionType, any>[] = [
            {
                title: '',
                width: 0,
                render: function RenderIcon(_, customFunction) {
                    return <CustomFunctionIcon src={customFunction.icon_url} size="small" />
                },
            },
            {
                title: 'Name',
                sticky: true,
                sorter: true,
                key: 'name',
                dataIndex: 'name',
                render: (_, customFunction) => {
                    return (
                        <LemonTableLink
                            to={urlForCustomFunction(customFunction)}
                            title={
                                <>
                                    <Tooltip title="Click to update configuration, view metrics, and more">
                                        <span>{customFunction.name}</span>
                                    </Tooltip>
                                    {customFunction.type === 'internal_destination' && (
                                        <NotificationContextTag customFunction={customFunction} />
                                    )}
                                </>
                            }
                            description={customFunction.description}
                        />
                    )
                },
            },
            {
                title: 'Created by',
                width: 0,
                render: (_, customFunction) => {
                    if (!customFunction.created_by) {
                        return <span className="text-muted">Unknown</span>
                    }
                    return (
                        <div className="flex items-center gap-2">
                            <ProfilePicture user={customFunction.created_by} size="sm" />
                            <span>{customFunction.created_by.first_name || customFunction.created_by.email}</span>
                        </div>
                    )
                },
            },

            updatedAtColumn() as LemonTableColumn<CustomFunctionType, any>,
            {
                title: 'Last 7 days',
                width: 0,
                render: (_, customFunction) => {
                    if (customFunction.id.startsWith('batch-export-')) {
                        // TODO: Make this less hacky, maybe with some extended type for managing these values
                        const batchExportId = customFunction.id.replace('batch-export-', '')
                        return (
                            <Link to={urlForCustomFunction(customFunction) + '?tab=metrics'}>
                                <AppMetricsSparkline
                                    logicKey={batchExportId}
                                    forceParams={{
                                        appSource: 'batch_export',
                                        appSourceId: batchExportId,
                                        metricKind: ['success', 'failure'],
                                        breakdownBy: 'metric_kind',
                                        interval: 'day',
                                        dateFrom: '-7d',
                                    }}
                                />
                            </Link>
                        )
                    }

                    if (isManualFunction(customFunction) || customFunction.type === 'site_app') {
                        return <>N/A</>
                    }

                    return (
                        <Link to={urlForCustomFunction(customFunction) + '?tab=metrics'}>
                            <AppMetricsSparkline
                                logicKey={customFunction.id}
                                forceParams={{
                                    appSource: 'custom_function',
                                    appSourceId: customFunction.id,
                                    metricKind: ['success', 'failure'],
                                    breakdownBy: 'metric_kind',
                                    interval: 'day',
                                    dateFrom: '-7d',
                                }}
                            />
                        </Link>
                    )
                },
            },
            {
                title: 'Status',
                key: 'enabled',
                sorter: (a) => (a.enabled ? 1 : -1),
                width: 0,
                render: function RenderStatus(_, customFunction) {
                    return <CustomFunctionStatusIndicator customFunction={customFunction} />
                },
            },
            {
                width: 0,
                render: function Render(_, customFunction) {
                    return (
                        <More
                            overlay={
                                <LemonMenuOverlay
                                    items={
                                        isManualFunction(customFunction)
                                            ? [
                                                  // TRICKY: Hack for now to just link out to the full view
                                                  {
                                                      label: 'View & configure',
                                                      to: urlForCustomFunction(customFunction),
                                                  },
                                              ]
                                            : [
                                                  {
                                                      label: customFunction.enabled ? 'Pause' : 'Unpause',
                                                      onClick: () => toggleEnabled(customFunction, !customFunction.enabled),
                                                  },
                                                  {
                                                      label: 'Delete',
                                                      status: 'danger' as const, // for typechecker happiness
                                                      onClick: () => deleteCustomFunction(customFunction),
                                                  },
                                              ]
                                    }
                                />
                            }
                        />
                    )
                },
            },
        ]

        if (props.type === 'transformation') {
            // insert it in the second column
            columns.splice(1, 0, {
                title: 'Prio',
                key: 'execution_order',
                sorter: (a) => (a.execution_order ? 1 : -1),
                width: 0,
                render: function Render(_, customFunction) {
                    return (
                        <LemonButton
                            size="small"
                            tooltip="Transformations are executed in a specific order. Click to reorder them."
                            onClick={() => setReorderModalOpen(true)}
                        >
                            <LemonBadge.Number count={customFunction.execution_order ?? 0} status="muted" />
                        </LemonButton>
                    )
                },
            })
        }

        return columns
    }, [props.type, humanizedType, toggleEnabled, deleteCustomFunction, isManualFunction]) // oxlint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-center">
                <LemonInput
                    type="search"
                    placeholder="Search..."
                    value={filters.search ?? ''}
                    onChange={(e) => setFilters({ search: e })}
                />
                {!hideFeedback ? (
                    <Link className="text-sm font-semibold" subtle onClick={() => openFeedbackDialog(props.type)}>
                        Can't find what you're looking for?
                    </Link>
                ) : null}
                <div className="flex-1" />
                <div className="flex flex-col xl:flex-row items-center gap-0.5 xl:gap-2 shrink-0">
                    <span className="text-xs xl:text-sm">Created by:</span>
                    <MemberSelect
                        value={filters.createdBy || null}
                        onChange={(user) => setFilters({ createdBy: user?.uuid || null })}
                    />
                </div>
                <LemonCheckbox
                    label="Show paused"
                    bordered
                    size="small"
                    checked={filters.showPaused}
                    onChange={(e) => setFilters({ showPaused: e ?? undefined })}
                />
                {extraControls}
            </div>

            <BindLogic logic={customFunctionsListLogic} props={props}>
                <LemonTable
                    dataSource={filteredCustomFunctions}
                    size="small"
                    loading={loading}
                    columns={columns}
                    emptyState={
                        customFunctions.length === 0 && !loading ? (
                            (emptyText ?? `No ${humanizedType}s found`)
                        ) : (
                            <>
                                No {humanizedType}s matching filters.{' '}
                                <Link onClick={() => resetFilters()}>Clear filters</Link>{' '}
                            </>
                        )
                    }
                    footer={
                        hiddenCustomFunctions.length > 0 && (
                            <div className="p-3 text-secondary">
                                {hiddenCustomFunctions.length} hidden.{' '}
                                <Link
                                    onClick={() => {
                                        resetFilters()
                                        setFilters({ showPaused: true })
                                    }}
                                >
                                    Show all
                                </Link>
                            </div>
                        )
                    }
                />
                <CustomFunctionOrderModal />
            </BindLogic>
        </div>
    )
}

import { BindLogic, useActions, useValues } from 'kea'
import { combineUrl, router } from 'kea-router'
import { useCallback, useMemo } from 'react'

import { IconBell } from '@hanzo/icons'
import {
    Badge,
    Button,
    Checkbox,
    Input,
    Select,
    Table,
    TableColumn,
    Tag,
    Link,
    Tooltip,
} from '@hanzo/elements'

import { AppMetricsSparkline } from 'lib/components/AppMetrics/AppMetricsSparkline'
import { MemberSelect } from 'lib/components/MemberSelect'
import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { More } from 'lib/elements/Button/More'
import { MenuOverlay } from 'lib/elements/Menu/Menu'
import { createdByColumn, updatedAtColumn } from 'lib/elements/Table/columnUtils'
import { TableLink } from 'lib/elements/Table/TableLink'
import { urls } from 'scenes/urls'

import { InsightsFunctionConfigurationContextId, InsightsFunctionType } from '~/types'

import { InsightsFunctionIcon } from '../configuration/InsightsFunctionIcon'
import { humanizeInsightsFunctionType } from '../script-function-utils'
import { InsightsFunctionStatusIndicator } from '../misc/InsightsFunctionStatusIndicator'
import { eventToInsightsFunctionContextId } from '../sub-templates/sub-templates'
import { DELIVERY_TYPE_FILTER_OPTIONS, DeliveryTypeTag } from './DeliveryTypeTag'
import { InsightsFunctionOrderModal } from './InsightsFunctionOrderModal'
import { insightsFunctionRequestModalLogic } from './insightsFunctionRequestModalLogic'
import { InsightsFunctionListLogicProps, insightsFunctionsListLogic } from './insightsFunctionsListLogic'

const INTERNAL_DESTINATION_CONTEXT: Partial<
    Record<InsightsFunctionConfigurationContextId, { label: string; url?: string }>
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
    'experiment-alerts': { label: 'Experiment alerts' },
    'health-alerts': {
        label: 'Health alerts',
        url: urls.healthAlerts(),
    },
}

function NotificationContextTag({ insightsFunction }: { insightsFunction: InsightsFunctionType }): JSX.Element | null {
    const eventId = insightsFunction.filters?.events?.[0]?.id
    const contextId = eventToInsightsFunctionContextId(eventId)
    const context = INTERNAL_DESTINATION_CONTEXT[contextId]
    if (!context) {
        return null
    }

    const tooltipTitle = context.url
        ? `Notification managed in ${context.label} settings. Click to go there.`
        : `Notification managed in ${context.label} settings.`

    return (
        <Tooltip title={tooltipTitle}>
            <Tag
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
            </Tag>
        </Tooltip>
    )
}

// `returnTo` only applies to the canonical script-function path; legacy plugin and
// batch-export scenes don't read it.
export const urlForInsightsFunction = (insightsFunction: InsightsFunctionType, returnTo?: string): string => {
    if (insightsFunction.id.startsWith('plugin-')) {
        return urls.legacyPlugin(insightsFunction.id.replace('plugin-', ''))
    }
    if (insightsFunction.id.startsWith('batch-export-')) {
        return urls.batchExport(insightsFunction.id.replace('batch-export-', ''))
    }
    const path = urls.insightsFunction(insightsFunction.id)
    return returnTo ? combineUrl(path, { returnTo }).url : path
}

export function InsightsFunctionList({
    extraControls,
    hideFeedback = false,
    emptyText,
    onDeleteInsightsFunction,
    onEditInsightsFunction,
    returnTo,
    ...props
}: InsightsFunctionListLogicProps & {
    extraControls?: JSX.Element
    hideFeedback?: boolean
    emptyText?: string
    onDeleteInsightsFunction?: (insightsFunction: InsightsFunctionType) => void
    onEditInsightsFunction?: (insightsFunction: InsightsFunctionType) => void
    returnTo?: string
}): JSX.Element {
    const { loading, filteredInsightsFunctions, filters, insightsFunctions, hiddenInsightsFunctions } = useValues(
        insightsFunctionsListLogic(props)
    )
    const { loadInsightsFunctions, setFilters, resetFilters, toggleEnabled, deleteInsightsFunction, setReorderModalOpen } =
        useActions(insightsFunctionsListLogic(props))

    const { openFeedbackDialog } = useActions(insightsFunctionRequestModalLogic)

    const humanizedType = humanizeInsightsFunctionType(props.type)

    useOnMountEffect(loadInsightsFunctions)

    const isManualFunction = useCallback(
        (insightsFunction: InsightsFunctionType): boolean => {
            return props.manualFunctions?.find((f) => f.id === insightsFunction.id) !== undefined
        },
        [props.manualFunctions]
    )

    const columns = useMemo(() => {
        const columns: TableColumn<InsightsFunctionType, any>[] = [
            {
                title: '',
                width: 0,
                render: function RenderIcon(_, insightsFunction) {
                    return <InsightsFunctionIcon src={insightsFunction.icon_url} size="small" />
                },
            },
            {
                title: 'Name',
                sticky: true,
                sorter: (a, b) =>
                    (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base', numeric: true }),
                key: 'name',
                dataIndex: 'name',
                render: (_, insightsFunction) => {
                    return (
                        <TableLink
                            to={urlForInsightsFunction(insightsFunction, returnTo)}
                            onClick={onEditInsightsFunction ? () => onEditInsightsFunction(insightsFunction) : undefined}
                            title={
                                <>
                                    <Tooltip title="Click to update configuration, view metrics, and more">
                                        <span>{insightsFunction.name}</span>
                                    </Tooltip>
                                    {insightsFunction.type === 'internal_destination' && (
                                        <NotificationContextTag insightsFunction={insightsFunction} />
                                    )}
                                </>
                            }
                            description={insightsFunction.description}
                        />
                    )
                },
            },
            createdByColumn() as TableColumn<InsightsFunctionType, any>,

            updatedAtColumn() as TableColumn<InsightsFunctionType, any>,
            {
                title: 'Last 7 days',
                width: 0,
                render: (_, insightsFunction) => {
                    if (insightsFunction.id.startsWith('batch-export-')) {
                        // TODO: Make this less hacky, maybe with some extended type for managing these values
                        const batchExportId = insightsFunction.id.replace('batch-export-', '')
                        return (
                            <Link to={urlForInsightsFunction(insightsFunction) + '?tab=metrics'}>
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

                    if (isManualFunction(insightsFunction) || insightsFunction.type === 'site_app') {
                        return <>N/A</>
                    }

                    return (
                        <Link to={urlForInsightsFunction(insightsFunction) + '?tab=metrics'}>
                            <AppMetricsSparkline
                                logicKey={insightsFunction.id}
                                forceParams={{
                                    appSource: 'insights_function',
                                    appSourceId: insightsFunction.id,
                                    // Log transformations report drops and budget skips under
                                    // metric_kind 'other' — without it their sparkline reads as idle.
                                    metricKind:
                                        insightsFunction.type === 'transformation_log'
                                            ? ['success', 'failure', 'other']
                                            : ['success', 'failure'],
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
                render: function RenderStatus(_, insightsFunction) {
                    return <InsightsFunctionStatusIndicator insightsFunction={insightsFunction} />
                },
            },
            {
                width: 0,
                render: function Render(_, insightsFunction) {
                    return (
                        <More
                            overlay={
                                <MenuOverlay
                                    items={
                                        isManualFunction(insightsFunction)
                                            ? [
                                                  // TRICKY: Hack for now to just link out to the full view
                                                  {
                                                      label: 'View & configure',
                                                      to: urlForInsightsFunction(insightsFunction, returnTo),
                                                  },
                                              ]
                                            : [
                                                  {
                                                      label: insightsFunction.enabled ? 'Pause' : 'Unpause',
                                                      onClick: () => toggleEnabled(insightsFunction, !insightsFunction.enabled),
                                                  },
                                                  {
                                                      label: 'Delete',
                                                      status: 'danger' as const, // for typechecker happiness
                                                      onClick: () => {
                                                          onDeleteInsightsFunction?.(insightsFunction)
                                                          deleteInsightsFunction(insightsFunction)
                                                      },
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

        if (props.type === 'destination') {
            // insert after the Name column
            columns.splice(2, 0, {
                title: 'Type',
                key: 'deliveryType',
                width: 0,
                render: function RenderDeliveryType(_, insightsFunction) {
                    return <DeliveryTypeTag item={insightsFunction} />
                },
            })
        }

        if (props.type === 'transformation' || props.type === 'transformation_log') {
            // insert it in the second column
            columns.splice(1, 0, {
                title: 'Prio',
                key: 'execution_order',
                sorter: (a) => (a.execution_order ? 1 : -1),
                width: 0,
                render: function Render(_, insightsFunction) {
                    return (
                        <Button
                            size="small"
                            tooltip="Transformations are executed in a specific order. Click to reorder them."
                            onClick={() => setReorderModalOpen(true)}
                        >
                            <Badge.Number count={insightsFunction.execution_order ?? 0} status="muted" />
                        </Button>
                    )
                },
            })
        }

        return columns
    }, [
        props.type,
        humanizedType,
        toggleEnabled,
        deleteInsightsFunction,
        isManualFunction,
        onDeleteInsightsFunction,
        onEditInsightsFunction,
        returnTo,
    ]) // oxlint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-center">
                <Input
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
                {props.type === 'destination' && (
                    <Select
                        size="small"
                        value={filters.deliveryType ?? null}
                        onChange={(value) => setFilters({ deliveryType: value ?? undefined })}
                        options={DELIVERY_TYPE_FILTER_OPTIONS}
                    />
                )}
                <Checkbox
                    label="Show paused"
                    bordered
                    size="small"
                    checked={filters.showPaused}
                    onChange={(e) => setFilters({ showPaused: e ?? undefined })}
                />
                {extraControls}
            </div>

            <BindLogic logic={insightsFunctionsListLogic} props={props}>
                <Table
                    dataSource={filteredInsightsFunctions}
                    size="small"
                    loading={loading}
                    columns={columns}
                    pagination={{ pageSize: 30 }}
                    emptyState={
                        insightsFunctions.length === 0 && !loading ? (
                            (emptyText ?? `No ${humanizedType}s found`)
                        ) : (
                            <>
                                No {humanizedType}s matching filters.{' '}
                                <Link onClick={() => resetFilters()}>Clear filters</Link>{' '}
                            </>
                        )
                    }
                    footer={
                        hiddenInsightsFunctions.length > 0 && (
                            <div className="p-3 text-secondary">
                                {hiddenInsightsFunctions.length} hidden.{' '}
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
                <InsightsFunctionOrderModal />
            </BindLogic>
        </div>
    )
}

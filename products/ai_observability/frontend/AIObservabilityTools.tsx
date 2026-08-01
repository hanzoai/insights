import { useActions, useValues } from 'kea'
import { combineUrl, router } from 'kea-router'

import { IconGraph, IconRetentionHeatmap, IconTrends, IconUserPaths } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'
import { Link } from 'lib/elements/Link'
import { Tooltip } from 'lib/elements/Tooltip'
import { escapeRegex } from 'lib/utils/actions'
import { urls } from 'scenes/urls'

import { DataTable } from '~/queries/nodes/DataTable/DataTable'
import { type InsightVizNode, NodeKind } from '~/queries/schema/schema-general'
import { isInsightsQLQuery } from '~/queries/utils'
import { PropertyFilterType, PropertyOperator } from '~/types'

import { buildApplyUrlStatePayload, aiObservabilitySharedLogic } from './aiObservabilitySharedLogic'
import { useSortableColumns } from './hooks/useSortableColumns'
import { aiObservabilityToolsLogic } from './tabs/aiObservabilityToolsLogic'

export function AIObservabilityTools(): JSX.Element {
    const { applyUrlState } = useActions(aiObservabilitySharedLogic)
    const { dateFilter, propertyFilters: currentPropertyFilters } = useValues(aiObservabilitySharedLogic)
    const { setToolsSort } = useActions(aiObservabilityToolsLogic)
    const {
        toolsQuery,
        toolsSort,
        buildToolPathsQuery,
        buildToolSequencesQuery,
        buildToolTrendQuery,
        buildAllToolsTrendQuery,
        buildToolHeatmapQuery,
    } = useValues(aiObservabilityToolsLogic)
    const { searchParams } = useValues(router)

    const { renderSortableColumnTitle } = useSortableColumns(toolsSort, setToolsSort)

    return (
        <DataTable
            query={{
                ...toolsQuery,
                showSavedFilters: true,
            }}
            setQuery={(query) => {
                if (!isInsightsQLQuery(query.source)) {
                    console.warn('AIObservabilityTools received a non-InsightsQL query:', query.source)
                    return
                }
                const { filters = {} } = query.source
                const { dateRange = {} } = filters
                applyUrlState(
                    buildApplyUrlStatePayload({
                        dateFrom: dateRange.date_from || null,
                        dateTo: dateRange.date_to || null,
                        shouldFilterTestAccounts: filters.filterTestAccounts || false,
                        propertyFilters: filters.properties || [],
                        currentDateFilter: dateFilter,
                        currentPropertyFilters,
                    })
                )
            }}
            context={{
                customActions: [
                    <Tooltip title="View tool usage trends over time" key="trends">
                        <Button
                            icon={<IconTrends />}
                            size="small"
                            type="secondary"
                            to={urls.insightNew({ query: buildAllToolsTrendQuery })}
                            targetBlank
                            data-attr="llma-tools-all-trends-click"
                        >
                            Tool trends
                        </Button>
                    </Tooltip>,
                    <Tooltip title="View tool co-occurrence heatmap" key="heatmap">
                        <Button
                            icon={<IconRetentionHeatmap />}
                            size="small"
                            type="secondary"
                            to={urls.insightNew({ query: buildToolHeatmapQuery })}
                            targetBlank
                            data-attr="llma-tools-heatmap-click"
                        >
                            Tool co-occurrence
                        </Button>
                    </Tooltip>,
                ],
                columns: {
                    tool: {
                        render: function RenderTool(x) {
                            const toolValue = x.value
                            if (!toolValue || toolValue === 'null' || toolValue === '') {
                                return <span className="text-muted">Unknown tool</span>
                            }

                            const toolString = String(toolValue)

                            return (
                                <div className="flex items-center gap-1">
                                    <Tooltip title={`View generations calling ${toolString}`}>
                                        <Link
                                            to={
                                                combineUrl(urls.aiObservabilityGenerations(), {
                                                    ...searchParams,
                                                    filters: [
                                                        {
                                                            type: PropertyFilterType.Event,
                                                            key: '$ai_tools_called',
                                                            operator: PropertyOperator.Regex,
                                                            value: `(^|,)${escapeRegex(toolString)}(,|$)`,
                                                        },
                                                    ],
                                                }).url
                                            }
                                            className="font-mono text-sm"
                                            data-attr="llma-tools-row-click"
                                        >
                                            {toolString}
                                        </Link>
                                    </Tooltip>
                                    <Tooltip title={`View ${toolString} usage over time`}>
                                        <Button
                                            icon={<IconTrends />}
                                            size="xsmall"
                                            to={urls.insightNew({
                                                query: {
                                                    kind: NodeKind.InsightVizNode,
                                                    source: buildToolTrendQuery(toolString),
                                                } as InsightVizNode,
                                            })}
                                            targetBlank
                                            data-attr="llma-tools-trend-click"
                                        />
                                    </Tooltip>
                                    <Tooltip title={`View tool combinations with ${toolString}`}>
                                        <Button
                                            icon={<IconGraph />}
                                            size="xsmall"
                                            to={urls.insightNew({
                                                query: {
                                                    kind: NodeKind.InsightVizNode,
                                                    source: buildToolSequencesQuery(toolString),
                                                } as InsightVizNode,
                                            })}
                                            targetBlank
                                            data-attr="llma-tools-sequences-click"
                                        />
                                    </Tooltip>
                                    <Tooltip title={`View tool paths from ${toolString}`}>
                                        <Button
                                            icon={<IconUserPaths />}
                                            size="xsmall"
                                            to={urls.insightNew({
                                                query: {
                                                    kind: NodeKind.InsightVizNode,
                                                    source: buildToolPathsQuery(toolString),
                                                } as InsightVizNode,
                                            })}
                                            targetBlank
                                            data-attr="llma-tools-paths-click"
                                        />
                                    </Tooltip>
                                </div>
                            )
                        },
                    },
                    total_calls: {
                        renderTitle: () => (
                            <Tooltip title="Total number of times this tool was called">
                                {renderSortableColumnTitle('total_calls', 'Total calls')}
                            </Tooltip>
                        ),
                    },
                    traces: {
                        renderTitle: () => (
                            <Tooltip title="Number of unique traces where this tool was called">
                                {renderSortableColumnTitle('traces', 'Traces')}
                            </Tooltip>
                        ),
                    },
                    users: {
                        renderTitle: () => (
                            <Tooltip title="Number of unique users who triggered this tool">
                                {renderSortableColumnTitle('users', 'Users')}
                            </Tooltip>
                        ),
                    },
                    sessions: {
                        renderTitle: () => (
                            <Tooltip title="Number of unique sessions where this tool was called">
                                {renderSortableColumnTitle('sessions', 'Sessions')}
                            </Tooltip>
                        ),
                    },
                    single_pct: {
                        renderTitle: () => (
                            <Tooltip title="Percentage of calls where this was the only tool called">
                                {renderSortableColumnTitle('single_pct', 'Single %')}
                            </Tooltip>
                        ),
                        render: function RenderSinglePct(x) {
                            return <span>{String(x.value)}%</span>
                        },
                    },
                    days_seen: {
                        renderTitle: () => (
                            <Tooltip title="Number of distinct days this tool was called">
                                {renderSortableColumnTitle('days_seen', 'Days seen')}
                            </Tooltip>
                        ),
                    },
                    first_seen: {
                        renderTitle: () => renderSortableColumnTitle('first_seen', 'First seen'),
                    },
                    last_seen: {
                        renderTitle: () => renderSortableColumnTitle('last_seen', 'Last seen'),
                    },
                },
            }}
            uniqueKey="llm-analytics-tools"
        />
    )
}

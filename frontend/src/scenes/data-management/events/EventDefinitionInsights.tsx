import { useActions, useValues } from 'kea'

import { Input } from '@hanzo/elements'

import { TZLabel } from 'lib/components/TZLabel'
import { Table, TableColumn, TableColumns } from 'lib/elements/Table'
import { TableLink } from 'lib/elements/Table/TableLink'
import { createdAtColumn, createdByColumn } from 'lib/elements/Table/columnUtils'
import { INSIGHTS_PER_PAGE, eventInsightsLogic } from 'scenes/data-management/events/eventInsightsLogic'
import { useSummarizeInsight } from 'scenes/insights/summarizeInsight'
import { InsightIcon } from 'scenes/saved-insights/SavedInsights'
import { urls } from 'scenes/urls'

import { SceneSection } from '~/layout/scenes/components/SceneSection'
import { EventDefinition, QueryBasedInsightModel } from '~/types'

export function EventDefinitionInsights({ definition }: { definition: EventDefinition }): JSX.Element {
    const event = definition.name
    const { page, insights, filters, insightsLoading, sorting } = useValues(eventInsightsLogic({ event }))
    const { setPage, setFilters } = useActions(eventInsightsLogic({ event }))
    const summarizeInsight = useSummarizeInsight()

    const columns: TableColumns<QueryBasedInsightModel> = [
        {
            key: 'id',
            width: 32,
            render: function renderType(_, insight) {
                return <InsightIcon insight={insight} className="text-secondary text-2xl" />
            },
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: function renderName(name: string, insight) {
                return (
                    <>
                        <TableLink
                            to={urls.insightView(insight.short_id)}
                            title={<>{name || <i>{summarizeInsight(insight.query)}</i>}</>}
                            description={insight.description}
                        />
                    </>
                )
            },
            sorter: (a, b) => (a.name || summarizeInsight(a.query)).localeCompare(b.name || summarizeInsight(b.query)),
        },
        createdByColumn() as TableColumn<QueryBasedInsightModel, keyof QueryBasedInsightModel | undefined>,
        createdAtColumn() as TableColumn<QueryBasedInsightModel, keyof QueryBasedInsightModel | undefined>,
        {
            title: 'Last modified',
            sorter: true,
            dataIndex: 'last_modified_at',
            render: function renderLastModified(last_modified_at: string) {
                return (
                    <div className="whitespace-nowrap">{last_modified_at && <TZLabel time={last_modified_at} />}</div>
                )
            },
        },
    ]

    return (
        <SceneSection title="Insights using event" className="saved-insights">
            <Input
                type="search"
                placeholder="Search..."
                onChange={(value) => setFilters({ search: value })}
                value={filters.search || ''}
            />
            <Table
                id={`event-definition-insights-table-${definition.id}`}
                loading={insightsLoading}
                columns={columns}
                data-attr="event-definition-insights-table"
                dataSource={insights.results}
                pagination={{
                    controlled: true,
                    currentPage: page ?? 1,
                    entryCount: insights.count,
                    pageSize: INSIGHTS_PER_PAGE,
                    onForward: insights.next
                        ? () => {
                              setPage(page + 1)
                          }
                        : undefined,
                    onBackward: insights.previous
                        ? () => {
                              setPage(page - 1)
                          }
                        : undefined,
                }}
                sorting={sorting}
                onSort={(newSorting) =>
                    setFilters({
                        order: newSorting ? `${newSorting.order === -1 ? '-' : ''}${newSorting.columnKey}` : undefined,
                    })
                }
                rowKey="id"
                loadingSkeletonRows={INSIGHTS_PER_PAGE}
                nouns={['insight', 'insights']}
                useURLForSorting={false}
                emptyState="No insights found"
            />
        </SceneSection>
    )
}

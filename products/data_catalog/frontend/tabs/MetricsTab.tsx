import { useActions, useValues } from 'kea'

import { IconRefresh } from '@hanzo/icons'
import { Button, Dialog } from '@hanzo/elements'

import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { More } from 'lib/elements/Button/More'
import { Input } from 'lib/elements/Input'
import { Markdown } from 'lib/elements/Markdown'
import { SegmentedButton } from 'lib/elements/SegmentedButton'
import { Table, TableColumns } from 'lib/elements/Table'
import { createdAtColumn } from 'lib/elements/Table/columnUtils'
import { TableLink } from 'lib/elements/Table/TableLink'
import { Tag } from 'lib/elements/Tag'
import { Tooltip } from 'lib/elements/Tooltip'
import { urls } from 'scenes/urls'

import { ProductKey } from '~/queries/schema/schema-general'

import { humanizeDefinitionKind } from '../common'
import type { DataCatalogMetricApi } from '../generated/api.schemas'
import { MetricStatusFilter, metricsLogic } from '../metricsLogic'

const STATUS_FILTER_OPTIONS: { value: MetricStatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'proposed', label: 'Proposed' },
    { value: 'approved', label: 'Approved' },
]

function StatusTag({ metric }: { metric: DataCatalogMetricApi }): JSX.Element {
    return (
        <div className="flex items-center gap-1">
            <Tag type={metric.status === 'approved' ? 'success' : 'warning'}>{metric.status}</Tag>
            {metric.is_drifted && <Tag type="danger">Drifted</Tag>}
        </div>
    )
}

function SourceTag({ metric }: { metric: DataCatalogMetricApi }): JSX.Element {
    if (metric.created_source !== 'ai_generated') {
        return <span className="text-secondary">User</span>
    }
    const confidencePercent = metric.confidence != null ? `${Math.round(metric.confidence * 100)}%` : 'unknown'
    return (
        <Tooltip
            title={
                <div className="flex flex-col gap-1">
                    <span>Confidence: {confidencePercent}</span>
                    {metric.ai_model && <span>Model: {metric.ai_model}</span>}
                    {metric.reasoning && <span>{metric.reasoning}</span>}
                </div>
            }
        >
            <Tag type="completion">AI</Tag>
        </Tooltip>
    )
}

export function MetricsTab(): JSX.Element {
    const { metrics, allMetrics, allMetricsLoading, filters, actionsInFlight } = useValues(metricsLogic)
    const { setFilters, loadMetrics, approveMetric, refreshMetricFromInsight, deleteMetric, openNewMetricModal } =
        useActions(metricsLogic)

    const confirmDelete = (metric: DataCatalogMetricApi): void => {
        Dialog.open({
            title: 'Delete metric?',
            content: <div className="text-sm text-secondary">Deleting {metric.name} cannot be undone.</div>,
            primaryButton: {
                children: 'Delete',
                type: 'primary',
                status: 'danger',
                onClick: () => deleteMetric(metric.name),
            },
            secondaryButton: { children: 'Cancel', type: 'tertiary' },
        })
    }

    if (!allMetricsLoading && allMetrics.length === 0) {
        return (
            <ProductIntroduction
                productName="Data catalog"
                productKey={ProductKey.DATA_CATALOG}
                thingName="metric"
                description="Metrics give your team one canonical definition for a number. Define one from SQL, an insight, or written instructions."
                isEmpty
                action={openNewMetricModal}
            />
        )
    }

    const columns: TableColumns<DataCatalogMetricApi> = [
        {
            title: 'Name',
            key: 'name',
            dataIndex: 'name',
            render: (_, metric) => (
                <TableLink
                    to={urls.dataCatalogMetric(metric.name)}
                    title={metric.display_name || metric.name}
                    // Render descriptions with images disabled so a stored image URL can't beacon other viewers.
                    description={
                        metric.description ? (
                            <Markdown className="max-w-[30rem]" lowKeyHeadings disableImages>
                                {metric.description}
                            </Markdown>
                        ) : undefined
                    }
                />
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, metric) => <StatusTag metric={metric} />,
        },
        {
            title: 'Definition',
            key: 'definition_kind',
            render: (_, metric) => <Tag type="option">{humanizeDefinitionKind(metric.definition_kind)}</Tag>,
        },
        {
            title: 'Source',
            key: 'created_source',
            render: (_, metric) => <SourceTag metric={metric} />,
        },
        {
            title: 'Owner',
            key: 'owner',
            render: (_, metric) => metric.owner || <span className="text-secondary">Unassigned</span>,
        },
        createdAtColumn<DataCatalogMetricApi>() as TableColumns<DataCatalogMetricApi>[number],
        {
            key: 'actions',
            width: 0,
            render: (_, metric) => {
                const inFlight = !!actionsInFlight[metric.name]
                return (
                    <More
                        overlay={
                            <>
                                {metric.status !== 'approved' && (
                                    <Button
                                        fullWidth
                                        loading={inFlight}
                                        disabledReason={
                                            metric.is_drifted
                                                ? 'This metric has drifted from its source insight. Refresh it first.'
                                                : undefined
                                        }
                                        onClick={() => approveMetric(metric.name)}
                                    >
                                        Approve
                                    </Button>
                                )}
                                {metric.source_insight_short_id && (
                                    <Button
                                        fullWidth
                                        loading={inFlight}
                                        onClick={() => refreshMetricFromInsight(metric.name)}
                                    >
                                        Refresh from insight
                                    </Button>
                                )}
                                <Button
                                    fullWidth
                                    status="danger"
                                    disabledReason={inFlight ? 'Working' : undefined}
                                    onClick={() => confirmDelete(metric)}
                                >
                                    Delete
                                </Button>
                            </>
                        }
                    />
                )
            },
        },
    ]

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-2 flex-wrap items-center">
                <Input
                    type="search"
                    placeholder="Search metrics"
                    value={filters.search}
                    onChange={(search) => setFilters({ search })}
                />
                <div className="flex items-center gap-2 flex-wrap">
                    <SegmentedButton
                        value={filters.status}
                        onChange={(status) => setFilters({ status })}
                        options={STATUS_FILTER_OPTIONS}
                        size="small"
                    />
                    <Button
                        type="secondary"
                        icon={<IconRefresh />}
                        onClick={() => loadMetrics()}
                        loading={allMetricsLoading}
                        size="small"
                    >
                        Reload
                    </Button>
                </div>
            </div>
            <Table
                data-attr="data-catalog-metrics-table"
                dataSource={metrics}
                rowKey="name"
                columns={columns}
                loading={allMetricsLoading}
                pagination={{ pageSize: 20 }}
                emptyState="No metrics match your filters."
                nouns={['metric', 'metrics']}
            />
        </div>
    )
}

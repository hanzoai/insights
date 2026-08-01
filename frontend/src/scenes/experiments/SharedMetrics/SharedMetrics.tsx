import { useActions, useValues } from 'kea'
import { router } from 'kea-router'

import { IconChevronLeft, IconChevronRight, IconCopy, IconPencil, IconTrash } from '@hanzo/icons'
import {
    Banner,
    Button,
    Dialog,
    Input,
    Table,
    TableColumn,
    TableColumns,
    Tag,
    Tooltip,
} from '@hanzo/elements'

import { More } from 'lib/elements/Button/More'
import { createdAtColumn, createdByColumn } from 'lib/elements/Table/columnUtils'
import { TableLink } from 'lib/elements/Table/TableLink'
import { pluralize } from 'lib/utils/strings'
import stringWithWBR from 'lib/utils/stringWithWBR'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { tagsModel } from '~/models/tagsModel'
import { NodeKind } from '~/queries/schema/schema-general'

import { isLegacySharedMetric } from '../utils'
import { InlineTagEditor } from './InlineTagEditor'
import { SharedMetric } from './sharedMetricLogic'
import { PAGE_SIZE, sharedMetricsLogic } from './sharedMetricsLogic'

export const scene: SceneExport = {
    component: SharedMetrics,
    logic: sharedMetricsLogic,
}

export function SharedMetrics(): JSX.Element {
    const { sharedMetrics, sharedMetricsLoading, searchTerm, savingTagsMetricId, count, page } =
        useValues(sharedMetricsLogic)
    const { setSearchTerm, setPage, updateSharedMetricTags, deleteSharedMetric } = useActions(sharedMetricsLogic)
    const { tags: allTags } = useValues(tagsModel)

    const startCount = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
    const endCount = page * PAGE_SIZE < count ? page * PAGE_SIZE : count

    const columns: TableColumns<SharedMetric> = [
        {
            key: 'name',
            title: 'Name',
            render: (_, sharedMetric) => {
                return (
                    <TableLink
                        to={sharedMetric.id ? urls.experimentsSharedMetric(sharedMetric.id) : undefined}
                        title={
                            <>
                                {stringWithWBR(sharedMetric.name, 17)}
                                {isLegacySharedMetric(sharedMetric) && (
                                    <Tooltip
                                        title="This metric uses the legacy engine, so some features and improvements may be missing."
                                        docLink="https://hanzo.ai/docs/experiments/new-experimentation-engine"
                                    >
                                        <Tag type="warning" className="ml-1">
                                            Legacy
                                        </Tag>
                                    </Tooltip>
                                )}
                            </>
                        }
                    />
                )
            },
        },
        {
            key: 'description',
            title: 'Description',
            dataIndex: 'description',
        },
        {
            title: 'Tags',
            dataIndex: 'tags' as keyof SharedMetric,
            render: function Render(_: any, metric: SharedMetric) {
                return (
                    <InlineTagEditor
                        metric={metric}
                        allTags={allTags}
                        onSave={(newTags) => updateSharedMetricTags(metric.id, newTags)}
                        saving={savingTagsMetricId === metric.id}
                    />
                )
            },
        } as TableColumn<SharedMetric, keyof SharedMetric | undefined>,
        {
            title: 'Type',
            key: 'type',
            render: (_, metric: SharedMetric) => {
                if (metric.query.kind === NodeKind.ExperimentMetric) {
                    return metric.query.metric_type
                }
                return metric.query.kind === NodeKind.ExperimentTrendsQuery ? 'Trend' : 'Funnel'
            },
        },
        createdByColumn<SharedMetric>() as TableColumn<SharedMetric, keyof SharedMetric | undefined>,
        createdAtColumn<SharedMetric>() as TableColumn<SharedMetric, keyof SharedMetric | undefined>,
        {
            key: 'actions',
            title: '',
            width: 0,
            render: (_, sharedMetric) => {
                return (
                    <More
                        size="xsmall"
                        overlay={
                            <>
                                <Button
                                    fullWidth
                                    size="small"
                                    icon={<IconPencil />}
                                    onClick={() => {
                                        router.actions.push(urls.experimentsSharedMetric(sharedMetric.id))
                                    }}
                                >
                                    Edit
                                </Button>
                                <Button
                                    fullWidth
                                    size="small"
                                    icon={<IconCopy />}
                                    onClick={() => {
                                        router.actions.push(urls.experimentsSharedMetric(sharedMetric.id, 'duplicate'))
                                    }}
                                >
                                    Duplicate
                                </Button>
                                <Button
                                    fullWidth
                                    size="small"
                                    icon={<IconTrash />}
                                    status="danger"
                                    onClick={() => {
                                        Dialog.open({
                                            title: 'Delete this metric?',
                                            content: (
                                                <div className="text-sm text-secondary">
                                                    This action cannot be undone.
                                                </div>
                                            ),
                                            primaryButton: {
                                                children: 'Delete',
                                                type: 'primary',
                                                onClick: () => deleteSharedMetric(sharedMetric.id),
                                                size: 'small',
                                            },
                                            secondaryButton: {
                                                children: 'Cancel',
                                                type: 'tertiary',
                                                size: 'small',
                                            },
                                        })
                                    }}
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
        <div className="deprecated-space-y-4">
            <Banner type="info">
                Shared metrics let you create reusable metrics that you can quickly add to any experiment. They are
                ideal for tracking key metrics like conversion rates or revenue across different experiments without
                having to set them up each time.
            </Banner>
            <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                    <Input
                        type="search"
                        placeholder="Search shared metrics..."
                        value={searchTerm}
                        onChange={setSearchTerm}
                    />
                    {count ? (
                        <span className="text-secondary whitespace-nowrap">
                            {`${startCount}${endCount > startCount ? '-' + endCount : ''} of ${pluralize(
                                count,
                                'metric'
                            )}`}
                        </span>
                    ) : null}
                </div>
                <Button size="small" type="primary" to={urls.experimentsSharedMetric('new')}>
                    New shared metric
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={sharedMetrics}
                loading={sharedMetricsLoading}
                emptyState={<div>You haven't created any shared metrics yet.</div>}
            />
            {count > PAGE_SIZE ? (
                <div className="flex items-center justify-end gap-1">
                    <span className="text-secondary whitespace-nowrap">
                        {`${startCount}${endCount > startCount ? '-' + endCount : ''} of ${pluralize(count, 'metric')}`}
                    </span>
                    <Button
                        icon={<IconChevronLeft />}
                        size="small"
                        disabledReason={page <= 1 ? 'No previous page' : undefined}
                        onClick={() => setPage(page - 1)}
                    />
                    <Button
                        icon={<IconChevronRight />}
                        size="small"
                        disabledReason={endCount >= count ? 'No next page' : undefined}
                        onClick={() => setPage(page + 1)}
                    />
                </div>
            ) : null}
        </div>
    )
}

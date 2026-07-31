import { useActions, useValues } from 'kea'
import { combineUrl, router } from 'kea-router'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { Button } from 'lib/elements/Button'
import { More } from 'lib/elements/Button/More'
import { Link } from 'lib/elements/Link'
import { ProfilePicture } from 'lib/elements/ProfilePicture'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { Input } from '~/lib/elements/Input'
import { Table, TableColumn, TableColumns } from '~/lib/elements/Table'
import { createdAtColumn, updatedAtColumn } from '~/lib/elements/Table/columnUtils'
import { ProductKey } from '~/queries/schema/schema-general'
import { AccessControlLevel, AccessControlResourceType, Dataset } from '~/types'

import { DATASETS_PER_PAGE, llmAnalyticsDatasetsLogic } from './llmAnalyticsDatasetsLogic'

export const scene: SceneExport = {
    component: LLMAnalyticsDatasetsScene,
    logic: llmAnalyticsDatasetsLogic,
    productKey: ProductKey.LLM_ANALYTICS,
}

export function LLMAnalyticsDatasetsScene(): JSX.Element {
    const { setFilters, deleteDataset } = useActions(llmAnalyticsDatasetsLogic)
    const { datasets, datasetsLoading, sorting, pagination, filters, datasetCountLabel } =
        useValues(llmAnalyticsDatasetsLogic)
    const { searchParams } = useValues(router)
    const datasetUrl = (id: string): string => combineUrl(urls.llmAnalyticsDataset(id), searchParams).url

    const columns: TableColumns<Dataset> = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: '20%',
            render: function renderName(_, dataset) {
                return (
                    <Link to={datasetUrl(dataset.id)} data-testid="dataset-link">
                        {dataset.name}
                    </Link>
                )
            },
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: '50%',
            render: function renderDescription(description) {
                return <span className="text-muted">{String(description) || <i>–</i>}</span>
            },
        },
        {
            title: 'Created by',
            dataIndex: 'created_by',
            render: function renderCreatedBy(_, item) {
                const { created_by } = item
                return (
                    <div className="flex flex-row items-center flex-nowrap">
                        {created_by && <ProfilePicture user={created_by} size="md" showName />}
                    </div>
                )
            },
        },
        createdAtColumn<Dataset>() as TableColumn<Dataset, keyof Dataset | undefined>,
        updatedAtColumn<Dataset>() as TableColumn<Dataset, keyof Dataset | undefined>,
        {
            width: 0,
            render: function renderMore(_, dataset) {
                return (
                    <More
                        overlay={
                            <>
                                <Button
                                    to={datasetUrl(dataset.id)}
                                    data-attr={`dataset-item-${dataset.id}-dropdown-view`}
                                    fullWidth
                                >
                                    View
                                </Button>

                                <AccessControlAction
                                    resourceType={AccessControlResourceType.LlmAnalytics}
                                    minAccessLevel={AccessControlLevel.Editor}
                                >
                                    <Button
                                        status="danger"
                                        onClick={() => deleteDataset(dataset.id)}
                                        data-attr={`dataset-item-${dataset.id}-dropdown-delete`}
                                        fullWidth
                                    >
                                        Delete
                                    </Button>
                                </AccessControlAction>
                            </>
                        }
                    />
                )
            },
        },
    ]

    return (
        <SceneContent>
            <SceneTitleSection
                name="Datasets"
                description="Manage datasets for testing and evaluation."
                resourceType={{ type: 'llm_datasets' }}
                actions={
                    <AccessControlAction
                        resourceType={AccessControlResourceType.LlmAnalytics}
                        minAccessLevel={AccessControlLevel.Editor}
                    >
                        <Button
                            type="primary"
                            to={datasetUrl('new')}
                            data-testid="create-dataset-button"
                            data-attr="create-dataset-button"
                            size="small"
                        >
                            New dataset
                        </Button>
                    </AccessControlAction>
                }
            />
            <div className="flex gap-x-4 gap-y-2 items-center flex-wrap py-4 -mt-4 mb-4 border-b justify-between">
                <Input
                    type="search"
                    placeholder="Search datasets..."
                    value={filters.search}
                    data-attr="datasets-search-input"
                    onChange={(value) => setFilters({ search: value })}
                    className="max-w-md"
                    data-testid="search-datasets-input"
                />
                <div className="text-muted-alt">{datasetCountLabel}</div>
            </div>

            <Table
                loading={datasetsLoading}
                columns={columns}
                dataSource={datasets.results}
                pagination={pagination}
                noSortingCancellation
                sorting={sorting}
                onSort={(newSorting) =>
                    setFilters({
                        order_by: newSorting
                            ? `${newSorting.order === -1 ? '-' : ''}${newSorting.columnKey}`
                            : undefined,
                    })
                }
                rowKey="id"
                loadingSkeletonRows={DATASETS_PER_PAGE}
                nouns={['dataset', 'datasets']}
            />
        </SceneContent>
    )
}

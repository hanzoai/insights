import { useActions, useValues } from 'kea'
import { router } from 'kea-router'

import { IconRefresh } from '@hanzo/icons'
import { Button, Dialog } from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { ObjectTags } from 'lib/components/ObjectTags/ObjectTags'
import { TagSelect } from 'lib/components/TagSelect'
import { More } from 'lib/elements/Button/More'
import { Divider } from 'lib/elements/Divider'
import { Input } from 'lib/elements/Input'
import { Table, TableColumn, TableColumns } from 'lib/elements/Table'
import { atColumn, createdAtColumn, createdByColumn } from 'lib/elements/Table/columnUtils'
import { TableLink } from 'lib/elements/Table/TableLink'
import { Tag } from 'lib/elements/Tag'
import { toast } from 'lib/elements/Toast/Toast'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { isInsightsQLQuery } from '~/queries/utils'
import { AccessControlLevel, AccessControlResourceType, EndpointType } from '~/types'

import { humanizeQueryKind } from './common'
import { EndpointFromInsightModal } from './EndpointFromInsightModal'
import { endpointLogic } from './endpointLogic'
import { endpointsLogic } from './endpointsLogic'

export function Endpoints(): JSX.Element {
    return (
        <>
            <EndpointsTable />
        </>
    )
}

export const EndpointsTable = (): JSX.Element => {
    const { setFilters, loadEndpoints } = useActions(endpointsLogic)
    const { endpoints, allEndpointsLoading, filters } = useValues(endpointsLogic)

    const { deleteEndpoint, confirmToggleActive, setDuplicateEndpoint } = useActions(endpointLogic)
    const { duplicateEndpoint } = useValues(endpointLogic)

    const handleDelete = (endpointName: string): void => {
        Dialog.open({
            title: 'Delete endpoint?',
            content: (
                <div className="text-sm text-secondary">
                    Are you sure you want to delete this endpoint? This action cannot be undone.
                </div>
            ),
            primaryButton: {
                children: 'Delete',
                type: 'primary',
                status: 'danger',
                onClick: () => {
                    deleteEndpoint(endpointName)
                },
                size: 'small',
            },
            secondaryButton: {
                children: 'Cancel',
                type: 'tertiary',
                size: 'small',
            },
        })
    }

    const handleEndpointActivation = (endpoint: EndpointType): void => {
        confirmToggleActive(endpoint)
    }

    const handleDuplicate = (endpoint: EndpointType): void => {
        if (isInsightsQLQuery(endpoint.query)) {
            router.actions.push(urls.sqlEditor({ query: endpoint.query.query, source: 'endpoint' }))
        } else {
            setDuplicateEndpoint(endpoint)
        }
    }

    const columns: TableColumns<EndpointType> = [
        {
            title: 'Name',
            key: 'name',
            dataIndex: 'name',
            width: '25%',
            render: function Render(_, record) {
                return (
                    <TableLink
                        to={urls.endpoint(record.name)}
                        title={
                            <>
                                {record.name}
                                <Tag type="option" size="small" className="mr-1">
                                    {record.query?.kind && humanizeQueryKind(record.query.kind)}
                                </Tag>
                            </>
                        }
                        description={record.description}
                    />
                )
            },
            sorter: (a: EndpointType, b: EndpointType) => a.name.localeCompare(b.name),
        },
        {
            title: 'Tags',
            key: 'tags',
            dataIndex: 'tags',
            render: function RenderTags(tags: EndpointType['tags']) {
                return tags && tags.length > 0 ? <ObjectTags tags={[...tags].sort()} staticOnly /> : null
            },
        } as TableColumn<EndpointType, keyof EndpointType | undefined>,
        createdAtColumn<EndpointType>() as TableColumn<EndpointType, keyof EndpointType | undefined>,
        createdByColumn<EndpointType>() as TableColumn<EndpointType, keyof EndpointType | undefined>,
        atColumn<EndpointType>('last_executed_at', 'Last executed at') as TableColumn<
            EndpointType,
            keyof EndpointType | undefined
        >,
        atColumn<EndpointType>(
            'materialization' as any,
            'Last materialized at',
            (record) => record.materialization?.last_materialized_at
        ) as TableColumn<EndpointType, keyof EndpointType | undefined>,
        {
            title: 'Endpoint path',
            key: 'endpoint_path',
            dataIndex: 'endpoint_path',
            render: (_, record) => (
                <Button
                    type="secondary"
                    size="xsmall"
                    onClick={() => {
                        navigator.clipboard.writeText(record.endpoint_path)
                        toast.success('Endpoint URL copied to clipboard')
                    }}
                    className="font-mono text-xs"
                >
                    {record.endpoint_path}
                </Button>
            ),
        },
        {
            title: 'Status',
            key: 'is_active',
            dataIndex: 'is_active',
            align: 'center',
            render: (_, record) => (
                <span>
                    {record.is_active ? (
                        <Tag type="success">Active</Tag>
                    ) : (
                        <Tag type="danger">Inactive</Tag>
                    )}
                </span>
            ),
            sorter: (a: EndpointType, b: EndpointType) => Number(b.is_active) - Number(a.is_active),
        },
        {
            key: 'actions',
            width: 0,
            render: (_, record) => (
                <More
                    overlay={
                        <>
                            <Button
                                onClick={() => {
                                    router.actions.push(urls.endpointsUsage({ endpointFilter: [record.name] }))
                                }}
                                fullWidth
                            >
                                View usage
                            </Button>
                            <AccessControlAction
                                resourceType={AccessControlResourceType.Endpoint}
                                minAccessLevel={AccessControlLevel.Editor}
                            >
                                <Button onClick={() => handleDuplicate(record)} fullWidth>
                                    Duplicate endpoint
                                </Button>
                            </AccessControlAction>

                            <Divider />
                            <AccessControlAction
                                resourceType={AccessControlResourceType.Endpoint}
                                minAccessLevel={AccessControlLevel.Editor}
                            >
                                <Button
                                    onClick={() => {
                                        handleEndpointActivation(record)
                                    }}
                                    fullWidth
                                    status="alt"
                                    data-attr="endpoint-activate"
                                >
                                    {record.is_active ? 'Deactivate endpoint' : 'Activate endpoint'}
                                </Button>
                            </AccessControlAction>
                            <AccessControlAction
                                resourceType={AccessControlResourceType.Endpoint}
                                minAccessLevel={AccessControlLevel.Editor}
                            >
                                <Button
                                    onClick={() => {
                                        handleDelete(record.name)
                                    }}
                                    fullWidth
                                    status="danger"
                                >
                                    Delete endpoint
                                </Button>
                            </AccessControlAction>
                        </>
                    }
                />
            ),
        },
    ]

    return (
        <SceneContent>
            <div className="flex justify-between gap-2 flex-wrap items-center">
                <Input
                    type="search"
                    placeholder="Search for endpoints"
                    onChange={(x) => setFilters({ search: x })}
                    value={filters.search}
                />
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="ml-1">
                        <b>Tags</b>
                    </span>
                    <TagSelect
                        defaultLabel="Any tags"
                        value={filters.tags}
                        onChange={(tags) => setFilters({ tags })}
                        data-attr="endpoints-tag-filter"
                    />
                    <Button
                        type="secondary"
                        icon={<IconRefresh />}
                        onClick={() => loadEndpoints()}
                        loading={allEndpointsLoading}
                        size="small"
                    >
                        Reload
                    </Button>
                </div>
            </div>
            <Table
                data-attr="endpoints-table"
                pagination={{ pageSize: 20 }}
                dataSource={endpoints as EndpointType[]}
                rowKey="id"
                rowClassName={(record) => (record._highlight ? 'highlighted' : null)}
                columns={columns}
                loading={allEndpointsLoading}
                defaultSorting={{
                    columnKey: 'last_executed_at',
                    order: -1,
                }}
                emptyState="No endpoints matching your filters!"
                nouns={['endpoint', 'endpoints']}
            />
            {duplicateEndpoint && (
                <EndpointFromInsightModal
                    insightQuery={duplicateEndpoint.query}
                    insightShortId={duplicateEndpoint.derived_from_insight ?? undefined}
                />
            )}
        </SceneContent>
    )
}

import { useActions, useValues } from 'kea'
import { router } from 'kea-router'

import { IconRefresh } from '@hanzo/icons'
import { Button, Dialog } from '@hanzo/elements'

import { More } from 'lib/elements/Button/More'
import { Divider } from 'lib/elements/Divider'
import { Input } from 'lib/elements/Input'
import { Table, TableColumn, TableColumns } from 'lib/elements/Table'
import { TableLink } from 'lib/elements/Table/TableLink'
import { atColumn, createdAtColumn, createdByColumn } from 'lib/elements/Table/columnUtils'
import { Tag } from 'lib/elements/Tag'
import { toast } from 'lib/elements/Toast/Toast'
import { OutputTab } from 'scenes/data-warehouse/editor/outputPaneLogic'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { isInsightsQLQuery } from '~/queries/utils'
import { EndpointType } from '~/types'

import { EndpointFromInsightModal } from './EndpointFromInsightModal'
import { humanizeQueryKind } from './common'
import { endpointLogic } from './endpointLogic'
import { endpointsLogic } from './endpointsLogic'

interface EndpointsProps {
    tabId: string
}

interface EndpointsTableProps {
    tabId: string
}

export function Endpoints({ tabId }: EndpointsProps): JSX.Element {
    return (
        <>
            <EndpointsTable tabId={tabId} />
        </>
    )
}

export const EndpointsTable = ({ tabId }: EndpointsTableProps): JSX.Element => {
    const { setFilters, loadEndpoints } = useActions(endpointsLogic({ tabId }))
    const { endpoints, allEndpointsLoading, filters } = useValues(endpointsLogic({ tabId }))

    const { deleteEndpoint, confirmToggleActive, setDuplicateEndpoint } = useActions(endpointLogic({ tabId }))
    const { duplicateEndpoint } = useValues(endpointLogic({ tabId }))

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
            router.actions.push(urls.sqlEditor({ query: endpoint.query.query, outputTab: OutputTab.Endpoint }))
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
                            <Button onClick={() => handleDuplicate(record)} fullWidth>
                                Duplicate endpoint
                            </Button>

                            <Divider />
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
                            <Button
                                onClick={() => {
                                    handleDelete(record.name)
                                }}
                                fullWidth
                                status="danger"
                            >
                                Delete endpoint
                            </Button>
                        </>
                    }
                />
            ),
        },
    ]

    return (
        <SceneContent>
            <div className="flex justify-between gap-2 flex-wrap">
                <Input
                    type="search"
                    className="w-1/3"
                    placeholder="Search for endpoints"
                    onChange={(x) => setFilters({ search: x })}
                    value={filters.search}
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
                    tabId={tabId}
                    insightQuery={duplicateEndpoint.query}
                    insightShortId={duplicateEndpoint.derived_from_insight ?? undefined}
                />
            )}
        </SceneContent>
    )
}

import { useActions, useValues } from 'kea'
import { combineUrl } from 'kea-router'

import { Button, Table, Tag } from '@hanzo/elements'
import type { TableColumns } from '@hanzo/elements'

import { More } from 'lib/elements/Button/More'
import { TableLink } from 'lib/elements/Table/TableLink'
import { createdAtColumn, createdByColumn } from 'lib/elements/Table/columnUtils'
import { urls } from 'scenes/urls'

import { SceneSection } from '~/layout/scenes/components/SceneSection'
import type { EndpointVersionType } from '~/types'

import { endpointLogic } from '../endpointLogic'
import { EndpointTab, endpointSceneLogic } from '../endpointSceneLogic'

interface EndpointVersionsProps {
    tabId: string
}

function getStatusTagType(status: string | undefined): 'success' | 'danger' | 'warning' | 'default' {
    if (!status) {
        return 'warning'
    }
    switch (status.toLowerCase()) {
        case 'failed':
            return 'danger'
        case 'running':
            return 'warning'
        case 'completed':
            return 'success'
        default:
            return 'default'
    }
}

export function EndpointVersions({ tabId }: EndpointVersionsProps): JSX.Element {
    const { endpoint, versions, versionsLoading } = useValues(endpointLogic({ tabId }))
    const { updateEndpoint } = useActions(endpointLogic({ tabId }))
    const { viewingVersion } = useValues(endpointSceneLogic({ tabId }))

    if (!endpoint) {
        return <></>
    }

    const columns: TableColumns<EndpointVersionType> = [
        {
            title: 'Version',
            dataIndex: 'version',
            key: 'version',
            width: '25%',
            render: function Render(_, record) {
                const isViewing = viewingVersion?.version === record.version
                const isCurrent = record.version === endpoint.current_version
                const versionUrl = combineUrl(urls.endpoint(endpoint.name), {
                    tab: EndpointTab.VERSIONS,
                    ...(isCurrent ? {} : { version: record.version }),
                }).url
                return (
                    <TableLink
                        to={versionUrl}
                        title={
                            <>
                                v{record.version}
                                {isCurrent && (
                                    <Tag type="completion" className="ml-2">
                                        Latest
                                    </Tag>
                                )}
                                {isViewing && !isCurrent && (
                                    <Tag type="highlight" className="ml-2">
                                        Viewing
                                    </Tag>
                                )}
                            </>
                        }
                        description={record.description}
                    />
                )
            },
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'status',
            align: 'center',
            render: function RenderStatus(_, record) {
                return record.is_active ? (
                    <Tag type="success">Active</Tag>
                ) : (
                    <Tag type="danger">Inactive</Tag>
                )
            },
        },
        {
            title: 'Materialized',
            dataIndex: 'is_materialized',
            key: 'materialization',
            render: function RenderMaterialization(_, record) {
                if (!record.is_materialized) {
                    return <span className="text-muted">-</span>
                }
                return (
                    <div className="flex items-center gap-2">
                        <Tag type={getStatusTagType(record.materialization?.status)}>
                            {record.materialization?.status || 'Unknown'}
                        </Tag>
                    </div>
                )
            },
        },
        createdAtColumn<EndpointVersionType>() as any,
        createdByColumn<EndpointVersionType>() as any,
        {
            key: 'actions',
            width: 0,
            render: function RenderActions(_, record) {
                const isCurrent = record.version === endpoint.current_version
                const versionUrl = combineUrl(urls.endpoint(endpoint.name), {
                    tab: EndpointTab.VERSIONS,
                    ...(isCurrent ? {} : { version: record.version }),
                }).url
                return (
                    <More
                        overlay={
                            <>
                                <Button fullWidth to={versionUrl}>
                                    View version
                                </Button>
                                <Button
                                    fullWidth
                                    onClick={() =>
                                        updateEndpoint(
                                            endpoint.name,
                                            { is_active: !record.is_active },
                                            { version: record.version }
                                        )
                                    }
                                >
                                    {record.is_active ? 'Deactivate version' : 'Activate version'}
                                </Button>
                            </>
                        }
                    />
                )
            },
        },
    ]

    return (
        <SceneSection
            title="Endpoint versions"
            description="Updating an endpoint's query creates a new version. However, you can manage each endpoint version's configuration separately. You can also either deactivate a single version, or the entire endpoint."
        >
            <Table
                data-attr="endpoint-versions-table"
                dataSource={versions || []}
                columns={columns}
                loading={versionsLoading}
                rowKey="id"
                emptyState="No versions found"
                nouns={['version', 'versions']}
            />
        </SceneSection>
    )
}

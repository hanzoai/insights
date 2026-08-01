import { useActions, useValues } from 'kea'

import { Button, Dialog, Input, Table, Spinner } from '@hanzo/elements'

import { TableLink } from 'lib/elements/Table/TableLink'
import { urls } from 'scenes/urls'

import { sourceManagementLogic } from '../logics/sourceManagementLogic'
import { SourceIcon } from './SourceIcon'

export function DirectConnectSourcesTable(): JSX.Element {
    const { filteredDirectSources, directSearchTerm, sourceReloadingById, dataWarehouseSourcesLoading } =
        useValues(sourceManagementLogic)
    const { setDirectSearchTerm, reloadSource, deleteSource } = useActions(sourceManagementLogic)

    return (
        <div>
            <div className="flex gap-2 justify-between items-center mb-4">
                <Input
                    type="search"
                    placeholder="Search..."
                    onChange={setDirectSearchTerm}
                    value={directSearchTerm}
                />
            </div>
            <Table
                id="direct-connect-sources"
                dataSource={filteredDirectSources}
                loading={dataWarehouseSourcesLoading}
                pagination={{ pageSize: 10 }}
                scrollToTopOnPageChange={false}
                columns={[
                    {
                        width: 0,
                        render: (_, source) => <SourceIcon type={source.source_type} />,
                    },
                    {
                        title: 'Source',
                        key: 'name',
                        render: (_, source) => (
                            <TableLink
                                to={urls.dataWarehouseSource(`managed-${source.id}`)}
                                title={source.prefix || source.source_type}
                                description={source.description}
                            />
                        ),
                    },
                    {
                        key: 'actions',
                        render: (_, source) => (
                            <div className="flex flex-row justify-end">
                                {sourceReloadingById[source.id] ? (
                                    <Spinner />
                                ) : (
                                    <>
                                        <Button
                                            data-attr={`reload-data-warehouse-${source.source_type}`}
                                            onClick={() => reloadSource(source)}
                                        >
                                            Reload
                                        </Button>
                                        <Button
                                            status="danger"
                                            data-attr={`delete-data-warehouse-${source.source_type}`}
                                            onClick={() => {
                                                Dialog.open({
                                                    title: 'Delete data source?',
                                                    description:
                                                        'Are you sure you want to delete this data source? All related tables will be deleted.',
                                                    primaryButton: {
                                                        children: 'Delete',
                                                        status: 'danger',
                                                        onClick: () => deleteSource(source),
                                                    },
                                                    secondaryButton: {
                                                        children: 'Cancel',
                                                    },
                                                })
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </div>
                        ),
                    },
                ]}
            />
        </div>
    )
}

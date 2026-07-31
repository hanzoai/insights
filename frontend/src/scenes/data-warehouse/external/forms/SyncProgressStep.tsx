import { useActions, useValues } from 'kea'

import { Button, Table, TableColumns, Tag, TagType } from '@hanzo/elements'

import { sourceWizardLogic } from 'scenes/data-warehouse/new/sourceWizardLogic'
import { dataWarehouseSettingsLogic } from 'scenes/data-warehouse/settings/dataWarehouseSettingsLogic'
import { defaultQuery } from 'scenes/data-warehouse/utils'
import { urls } from 'scenes/urls'

import { SceneSection } from '~/layout/scenes/components/SceneSection'
import { ExternalDataSourceSchema } from '~/types'

export const SyncProgressStep = (): JSX.Element => {
    const { sourceId, isWrapped } = useValues(sourceWizardLogic)
    const { cancelWizard } = useActions(sourceWizardLogic)
    const { dataWarehouseSources, dataWarehouseSourcesLoading } = useValues(dataWarehouseSettingsLogic)
    const source = dataWarehouseSources?.results.find((n) => n.id === sourceId)
    const schemas = source?.schemas ?? []

    const getSyncStatus = (schema: ExternalDataSourceSchema): { status: string; tagType: TagType } => {
        if (!schema.should_sync) {
            return {
                status: 'Not synced',
                tagType: 'default',
            }
        }

        if (schema.status === 'Running') {
            return {
                status: 'Syncing...',
                tagType: 'primary',
            }
        }

        if (schema.status === 'Completed') {
            return {
                status: 'Completed',
                tagType: 'success',
            }
        }

        return {
            status: 'Error',
            tagType: 'danger',
        }
    }

    const columns: TableColumns<ExternalDataSourceSchema> = [
        {
            title: 'Table',
            key: 'table',
            render: function RenderTable(_, schema) {
                return schema.name
            },
        },
        {
            title: 'Status',
            key: 'status',
            render: function RenderStatus(_, schema) {
                const { status, tagType } = getSyncStatus(schema)

                return <Tag type={tagType}>{status}</Tag>
            },
        },
    ]

    if (!isWrapped) {
        columns.push({
            key: 'actions',
            width: 0,
            render: function RenderStatus(_, schema) {
                if (schema.table && schema.status === 'Completed') {
                    const query = defaultQuery(schema.table.name, schema.table.columns)
                    return (
                        <Button
                            className="my-1"
                            type="primary"
                            onClick={cancelWizard}
                            to={urls.sqlEditor({ query: query.source.query })}
                        >
                            Query
                        </Button>
                    )
                }

                return ''
            },
        })
    }

    return (
        <SceneSection title="You're all set! We'll import the data in the background, and after it's done, you will be able to query it in Insights.">
            <Table
                emptyState="No schemas selected"
                dataSource={schemas}
                loading={dataWarehouseSourcesLoading}
                disableTableWhileLoading={false}
                columns={columns}
            />
        </SceneSection>
    )
}

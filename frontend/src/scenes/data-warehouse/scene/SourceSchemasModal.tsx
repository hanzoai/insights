import { useActions, useValues } from 'kea'

import { IconRefresh } from '@hanzo/icons'

import { Banner } from 'lib/elements/Banner'
import { Button } from 'lib/elements/Button'
import { Modal } from 'lib/elements/Modal'
import { Table } from 'lib/elements/Table'

import { sourceSchemasModalLogic } from './sourceSchemasModalLogic'
import { sourceSchemaColumns } from './warehouseStatusDisplay'

export function SourceSchemasModal(): JSX.Element {
    const { activeSource, sourceSchemas, sourceSchemasLoading, sourceSchemasError } = useValues(sourceSchemasModalLogic)
    const { closeSourceSchemasModal, loadSourceSchemas } = useActions(sourceSchemasModalLogic)

    return (
        <Modal
            isOpen={!!activeSource}
            onClose={closeSourceSchemasModal}
            title={activeSource ? `${activeSource.sourceName} schemas` : 'Schemas'}
            width={960}
        >
            {sourceSchemasError ? (
                <Banner type="error">
                    <div className="flex items-center justify-between gap-3">
                        <span>Schemas could not be loaded.</span>
                        <Button
                            type="secondary"
                            size="small"
                            icon={<IconRefresh />}
                            onClick={() => activeSource && loadSourceSchemas(activeSource)}
                            loading={sourceSchemasLoading}
                        >
                            Try again
                        </Button>
                    </div>
                </Banner>
            ) : (
                <Table
                    dataSource={sourceSchemas}
                    columns={sourceSchemaColumns}
                    loading={sourceSchemasLoading}
                    rowKey="schema_id"
                    pagination={{ pageSize: 20 }}
                    emptyState="No schemas are configured for this source."
                />
            )}
        </Modal>
    )
}

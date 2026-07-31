import { useActions, useValues } from 'kea'

import { IconRefresh } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'
import { Table, TableColumns } from 'lib/elements/Table'
import { Spinner } from 'lib/elements/Spinner/Spinner'
import { humanFriendlyDetailedTime } from 'lib/utils'

import { AsyncMigration, AsyncMigrationError, asyncMigrationsLogic } from './asyncMigrationsLogic'

export function AsyncMigrationDetails({ asyncMigration }: { asyncMigration: AsyncMigration }): JSX.Element {
    const { asyncMigrationErrorsLoading, asyncMigrationErrors } = useValues(asyncMigrationsLogic)
    const { loadAsyncMigrationErrors } = useActions(asyncMigrationsLogic)

    const columns: TableColumns<AsyncMigrationError> = [
        {
            title: 'Error',
            dataIndex: 'description',
        },
        {
            title: (
                <Button
                    icon={asyncMigrationErrorsLoading[asyncMigration.id] ? <Spinner /> : <IconRefresh />}
                    onClick={() => loadAsyncMigrationErrors(asyncMigration.id)}
                    type="secondary"
                    size="small"
                >
                    Refresh errors
                </Button>
            ),
            render: function Render(_, asyncMigrationError: AsyncMigrationError): JSX.Element {
                return <div>{humanFriendlyDetailedTime(asyncMigrationError.created_at)}</div>
            },
        },
    ]
    return (
        <Table
            columns={columns}
            dataSource={asyncMigrationErrors[asyncMigration.id]}
            loading={asyncMigrationErrorsLoading[asyncMigration.id]}
            embedded
        />
    )
}

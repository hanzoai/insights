import { useActions, useValues } from 'kea'

import { IconRefresh } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'
import { Spinner } from 'lib/elements/Spinner'

import { dataNodeCollectionLogic } from '~/queries/nodes/DataNode/dataNodeCollectionLogic'
import { dataNodeLogic } from '~/queries/nodes/DataNode/dataNodeLogic'
import { shouldQueryBeAsync } from '~/queries/utils'

export function Reload(): JSX.Element {
    const { responseLoading, query } = useValues(dataNodeLogic)
    const { loadData, cancelQuery } = useActions(dataNodeLogic)

    return (
        <Button
            type="secondary"
            onClick={() => {
                if (responseLoading) {
                    cancelQuery()
                } else {
                    loadData(shouldQueryBeAsync(query) ? 'force_async' : 'force_blocking')
                }
            }}
            // Setting the loading icon manually to capture clicks while spinning.
            icon={responseLoading ? <Spinner textColored /> : <IconRefresh />}
            size="small"
        >
            {responseLoading ? 'Cancel' : 'Reload'}
        </Button>
    )
}

export function ReloadAll({ iconOnly }: { iconOnly?: boolean }): JSX.Element {
    const { areAnyLoading } = useValues(dataNodeCollectionLogic)
    const { reloadAll } = useActions(dataNodeCollectionLogic)

    return (
        <Button
            type="secondary"
            size="small"
            onClick={reloadAll}
            // Setting the loading icon manually to capture clicks while spinning.
            icon={areAnyLoading ? <Spinner textColored /> : <IconRefresh />}
            disabledReason={areAnyLoading ? 'Loading' : undefined}
        >
            {!iconOnly && 'Reload'}
        </Button>
    )
}

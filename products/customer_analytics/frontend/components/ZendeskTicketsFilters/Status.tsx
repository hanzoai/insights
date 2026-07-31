import { useActions, useValues } from 'kea'

import { Select } from '@hanzo/elements'

import { capitalizeFirstLetter } from 'lib/utils'

import { zendeskTicketsFiltersLogic } from './zendeskTicketsFiltersLogic'

const label = (key: string) => {
    switch (key) {
        case 'all':
        case null:
            return 'All statuses'
        default:
            return capitalizeFirstLetter(key)
    }
}

export const StatusFilter = (): JSX.Element => {
    const { status } = useValues(zendeskTicketsFiltersLogic)
    const { setStatus } = useActions(zendeskTicketsFiltersLogic)

    const options = ['all', 'new', 'open', 'hold', 'pending', 'solved', 'closed', 'deleted']

    return (
        <Select
            placeholder="Status"
            options={options.map((key) => ({ value: key, label: label(key) }))}
            value={status}
            onChange={(value) => setStatus(value)}
            size="small"
        />
    )
}

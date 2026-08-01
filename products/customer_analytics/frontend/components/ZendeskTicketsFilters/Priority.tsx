import { useActions, useValues } from 'kea'

import { Select } from '@hanzo/elements'

import { capitalizeFirstLetter } from 'lib/utils/strings'

import { zendeskTicketsFiltersLogic } from './zendeskTicketsFiltersLogic'

const label = (key: string): string => {
    switch (key) {
        case 'all':
        case null:
            return 'All priorities'
        default:
            return capitalizeFirstLetter(key)
    }
}

export const PriorityFilter = (): JSX.Element => {
    const { priority } = useValues(zendeskTicketsFiltersLogic)
    const { setPriority } = useActions(zendeskTicketsFiltersLogic)

    const options = ['all', 'low', 'normal', 'high', 'urgent']

    return (
        <Select
            placeholder="Priority"
            options={options.map((key) => ({ value: key, label: label(key) }))}
            value={priority}
            onChange={(value) => setPriority(value)}
            size="small"
        />
    )
}

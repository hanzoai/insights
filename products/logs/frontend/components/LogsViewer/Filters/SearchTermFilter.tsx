import { useActions, useValues } from 'kea'

import { Input } from '@hanzo/elements'

import { logsViewerFiltersLogic } from 'products/logs/frontend/components/LogsViewer/Filters/logsViewerFiltersLogic'

export const SearchTermFilter = (): JSX.Element => {
    const { filters } = useValues(logsViewerFiltersLogic)
    const { searchTerm } = filters
    const { setSearchTerm } = useActions(logsViewerFiltersLogic)

    return (
        <Input
            size="small"
            value={searchTerm}
            onChange={(value) => {
                setSearchTerm(value)
            }}
            placeholder="Search logs..."
        />
    )
}

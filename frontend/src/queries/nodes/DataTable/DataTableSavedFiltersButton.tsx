import { useActions, useValues } from 'kea'

import { IconBookmark } from '@hanzo/icons'
import { Button } from '@hanzo/elements'

import { DataTableNode } from '~/queries/schema/schema-general'

import { dataTableSavedFiltersLogic } from './dataTableSavedFiltersLogic'

export interface DataTableSavedFiltersButtonProps {
    uniqueKey: string
    query: DataTableNode
    setQuery: (query: DataTableNode) => void
}

export function DataTableSavedFiltersButton({
    uniqueKey,
    query,
    setQuery,
}: DataTableSavedFiltersButtonProps): JSX.Element {
    const logic = dataTableSavedFiltersLogic({ uniqueKey, query, setQuery })
    const { showSavedFilters } = useValues(logic)
    const { setShowSavedFilters } = useActions(logic)

    return (
        <Button
            type="secondary"
            size="small"
            icon={<IconBookmark />}
            onClick={() => setShowSavedFilters(!showSavedFilters)}
            active={showSavedFilters}
        >
            Saved filters
        </Button>
    )
}

import equal from 'fast-deep-equal'
import { useActions, useValues } from 'kea'

import { IconFilter } from '@hanzo/icons'
import { Tag } from '@hanzo/elements'

import { sessionRecordingsPlaylistLogic } from '../playlist/sessionRecordingsPlaylistLogic'
import { sessionRecordingSavedFiltersLogic } from './sessionRecordingSavedFiltersLogic'

export function CurrentFilterIndicator(): JSX.Element | null {
    const { appliedSavedFilter } = useValues(sessionRecordingSavedFiltersLogic)
    const { setAppliedSavedFilter } = useActions(sessionRecordingSavedFiltersLogic)
    const { resetFilters } = useActions(sessionRecordingsPlaylistLogic)
    const { filters: currentFilters } = useValues(sessionRecordingsPlaylistLogic)

    // Only show indicator when there's a named/saved filter applied
    if (!appliedSavedFilter) {
        return null
    }

    const hasFilterChanges = !equal(appliedSavedFilter.filters, currentFilters)

    const handleClearFilter = (): void => {
        resetFilters?.()
        setAppliedSavedFilter(null)
    }

    return (
        <div className="text-xs flex gap-2 items-center pt-2">
            <div className="font-semibold whitespace-nowrap flex-shrink-0">Current filter applied:</div>
            <div className="flex items-center min-w-0 flex-1">
                <Tag
                    data-attr="current-filter-indicator"
                    type={hasFilterChanges ? 'option' : 'primary'}
                    icon={<IconFilter />}
                    closable
                    onClose={handleClearFilter}
                    className="max-w-full"
                >
                    <span className="truncate">
                        {appliedSavedFilter.name || appliedSavedFilter.derived_name || 'Unnamed'}
                        {hasFilterChanges && ' (edited)'}
                    </span>
                </Tag>
            </div>
        </div>
    )
}

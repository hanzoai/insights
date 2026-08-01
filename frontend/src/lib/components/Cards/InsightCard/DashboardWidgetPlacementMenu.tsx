import { useCallback, useState } from 'react'

import { Button } from 'lib/elements/Button'
import { Input } from 'lib/elements/Input'
import { Menu, MenuItem, MenuItems } from 'lib/elements/Menu'

import type { DashboardBasicType } from '~/types'

export interface DashboardWidgetPlacementDestination {
    dashboard: DashboardBasicType
    /** When set, the row is disabled and this explains why (e.g. widget already on that dashboard). */
    disabledReason?: string
}

interface DashboardWidgetPlacementMenuProps {
    destinations: DashboardWidgetPlacementDestination[]
    onSelect: (dashboard: DashboardBasicType) => void
    /** Submenu trigger label (e.g. "Move to" vs "Copy to"). */
    label?: string
    /** When there are no destinations, the trigger stays visible but disabled (avoids hiding the action). */
    emptyDisabledReason?: string
}

export function DashboardWidgetPlacementMenu({
    destinations,
    onSelect,
    label = 'Move to',
    emptyDisabledReason = 'No other dashboards',
}: DashboardWidgetPlacementMenuProps): JSX.Element {
    const [searchTerm, setSearchTermState] = useState('')

    const handleSearchChange = useCallback((value: string) => {
        setSearchTermState(value)
    }, [])

    // TODO: make use Fuse search (might be overkill though)
    const filteredDestinations =
        searchTerm.trim() === ''
            ? destinations
            : destinations.filter((entry) =>
                  (entry.dashboard.name || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase())
              )

    const SearchInputLabel = useCallback(() => {
        return (
            <div className="px-2 pt-2 pb-1">
                <Input
                    type="search"
                    placeholder="Search dashboards"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    size="small"
                    fullWidth
                    allowClear
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                />
            </div>
        )
    }, [handleSearchChange, searchTerm])

    const searchItem: MenuItem = {
        custom: true,
        label: SearchInputLabel,
    }

    const items: MenuItems =
        filteredDestinations.length > 0
            ? [
                  { items: [searchItem] },
                  {
                      items: filteredDestinations.map(({ dashboard, disabledReason }) => ({
                          label: disabledReason ? (
                              <span className="flex flex-col items-start gap-0.5 text-left">
                                  <span>{dashboard.name || <i>Untitled</i>}</span>
                                  <span className="text-xs font-normal text-muted">{disabledReason}</span>
                              </span>
                          ) : (
                              dashboard.name || <i>Untitled</i>
                          ),
                          key: dashboard.id,
                          // Use `disabled` only: `disabledReason` on Button adds a redundant tooltip when the label already explains why.
                          disabled: !!disabledReason,
                          onClick: () => {
                              if (disabledReason) {
                                  return
                              }
                              onSelect(dashboard)
                              setSearchTermState('')
                          },
                      })),
                  },
              ]
            : [
                  {
                      items: [
                          searchItem,
                          {
                              label: 'No dashboards match this search',
                              key: 'no-results',
                          },
                      ],
                  },
              ]

    if (!destinations.length) {
        return (
            <Button fullWidth disabledReason={emptyDisabledReason}>
                {label}
            </Button>
        )
    }

    return (
        <Menu
            items={items}
            placement="right-start"
            fallbackPlacements={['left-start']}
            closeParentPopoverOnClickInside
        >
            <Button fullWidth>{label}</Button>
        </Menu>
    )
}

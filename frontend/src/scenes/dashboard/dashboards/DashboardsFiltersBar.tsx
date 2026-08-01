import { useActions, useValues } from 'kea'
import { useDebouncedCallback } from 'use-debounce'

import { IconChevronDown, IconFolder, IconPin, IconPinFilled, IconShare, IconX } from '@hanzo/icons'
import { Input, Popover } from '@hanzo/elements'

import { MemberSelectMultiplePopover } from 'lib/components/MemberSelectMultiplePopover'
import { Button } from 'lib/elements/Button'
import { DashboardsTab, dashboardsLogic } from 'scenes/dashboard/dashboards/dashboardsLogic'

interface DashboardsFiltersBarProps {
    extraActions?: JSX.Element | JSX.Element[]
}

export function DashboardsFiltersBar({ extraActions }: DashboardsFiltersBarProps): JSX.Element {
    const { filters, currentTab, filteredTags, tagSearch, showTagPopover } = useValues(dashboardsLogic)
    const { setFilters, setTagSearch, setShowTagPopover, setSearch } = useActions(dashboardsLogic)

    const createdByIds = filters.createdBy === 'All users' ? [] : filters.createdBy

    const debouncedSetSearch = useDebouncedCallback((value: string) => {
        setSearch(value)
    }, 300)

    const handleTagToggle = (tag: string): void => {
        const selected = new Set(filters.tags || [])
        if (selected.has(tag)) {
            selected.delete(tag)
        } else {
            selected.add(tag)
        }
        setFilters({ tags: Array.from(selected) })
    }

    return (
        <div className="flex justify-between gap-2 flex-wrap mb-4">
            <Input
                type="search"
                placeholder="Search for dashboards"
                onChange={(value) => {
                    setFilters({ search: value })
                    debouncedSetSearch(value)
                }}
                value={filters.search}
            />
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <span>Filter to:</span>
                    {currentTab !== DashboardsTab.Pinned && (
                        <div className="flex items-center gap-2">
                            <Button
                                active={filters.pinned}
                                type="secondary"
                                size="small"
                                onClick={() => setFilters({ pinned: !filters.pinned })}
                                icon={filters.pinned ? <IconPinFilled /> : <IconPin />}
                            >
                                Pinned
                            </Button>
                        </div>
                    )}
                    <Popover
                        visible={showTagPopover}
                        onClickOutside={() => setShowTagPopover(false)}
                        overlay={
                            <div className="max-w-100 deprecated-space-y-2">
                                <Input
                                    type="search"
                                    placeholder="Search tags"
                                    autoFocus
                                    value={tagSearch}
                                    onChange={setTagSearch}
                                    fullWidth
                                    className="max-w-full"
                                />
                                <ul className="deprecated-space-y-px">
                                    {filteredTags.map((tag: string) => (
                                        <li key={tag}>
                                            <Button
                                                fullWidth
                                                role="menuitem"
                                                size="small"
                                                onClick={() => handleTagToggle(tag)}
                                            >
                                                <span className="flex items-center justify-between gap-2 flex-1">
                                                    <span className="flex items-center gap-2 max-w-full">
                                                        <input
                                                            type="checkbox"
                                                            className="cursor-pointer"
                                                            checked={filters.tags?.includes(tag) || false}
                                                            readOnly
                                                        />
                                                        <span>{tag}</span>
                                                    </span>
                                                </span>
                                            </Button>
                                        </li>
                                    ))}
                                    {filteredTags.length === 0 ? (
                                        <div className="p-2 text-secondary italic truncate border-t">
                                            {tagSearch ? <span>No matching tags</span> : <span>No tags</span>}
                                        </div>
                                    ) : null}
                                    {(filters.tags?.length || 0) > 0 && (
                                        <>
                                            <div className="my-1 border-t" />
                                            <li>
                                                <Button
                                                    fullWidth
                                                    role="menuitem"
                                                    size="small"
                                                    onClick={() => setFilters({ tags: [] })}
                                                    type="tertiary"
                                                >
                                                    Clear selection
                                                </Button>
                                            </li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        }
                    >
                        <Button
                            type="secondary"
                            size="small"
                            icon={<IconChevronDown />}
                            sideIcon={null}
                            active={(filters.tags?.length || 0) > 0}
                            onClick={() => setShowTagPopover(!showTagPopover)}
                        >
                            Tags
                            {(filters.tags?.length || 0) > 0 && (
                                <span className="ml-1 text-xs">({filters.tags?.length})</span>
                            )}
                        </Button>
                    </Popover>
                    <div className="flex items-center gap-2">
                        <Button
                            active={filters.shared}
                            type="secondary"
                            size="small"
                            onClick={() => setFilters({ shared: !filters.shared })}
                            icon={<IconShare />}
                        >
                            Shared
                        </Button>
                    </div>
                    {filters.folder != null && (
                        <Button
                            active
                            type="secondary"
                            size="small"
                            className="max-w-full"
                            icon={<IconFolder />}
                            sideIcon={<IconX />}
                            onClick={() => setFilters({ folder: null })}
                            tooltip="Clear folder filter"
                        >
                            <span className="truncate">{filters.folder || 'Project root'}</span>
                        </Button>
                    )}
                </div>
                {currentTab !== DashboardsTab.Yours && (
                    <MemberSelectMultiplePopover
                        value={createdByIds}
                        onChange={(ids) => setFilters({ createdBy: ids.length > 0 ? ids : 'All users' })}
                    />
                )}
                {extraActions}
            </div>
        </div>
    )
}

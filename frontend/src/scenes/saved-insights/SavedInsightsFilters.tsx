import insights from 'insights-js'

import { IconFlag, IconHeart, IconHeartFilled } from '@hanzo/icons'

import { MemberSelectMultiplePopover } from 'lib/components/MemberSelectMultiplePopover'
import { TagSelect } from 'lib/components/TagSelect'
import { Button } from 'lib/elements/Button'
import { Input } from 'lib/elements/Input/Input'
import { Select } from 'lib/elements/Select'
import { Switch } from 'lib/elements/Switch'
import { Tooltip } from 'lib/elements/Tooltip'
import { cn } from 'lib/utils/css-classes'
import { INSIGHT_TYPE_OPTIONS } from 'scenes/saved-insights/SavedInsights'
import { SavedInsightFilters } from 'scenes/saved-insights/savedInsightsLogic'

export type QuickFilterKind = 'insightType' | 'tags' | 'createdBy' | 'favorites' | 'featureFlags'
const ALL_QUICK_FILTERS: QuickFilterKind[] = ['insightType', 'tags', 'createdBy', 'favorites', 'featureFlags']

export function SavedInsightsFilters({
    filters,
    setFilters,
    quickFilters = ALL_QUICK_FILTERS,
    borderless = false,
}: {
    filters: SavedInsightFilters
    setFilters: (filters: Partial<SavedInsightFilters>) => void
    quickFilters?: QuickFilterKind[]
    /** When true, inactive filters appear borderless. */
    borderless?: boolean
}): JSX.Element {
    const { search, hideFeatureFlagInsights, favorited, tags, insightType, createdBy } = filters
    const quickFilterSet = new Set(quickFilters)
    const hasInsightTypeSelection = !!insightType && insightType !== 'All types'

    return (
        <div className={cn('flex justify-between gap-2 items-center flex-wrap')}>
            <Input
                type="search"
                placeholder="Search for insights"
                onChange={(value) => setFilters({ search: value })}
                value={search || ''}
                autoFocus
                data-attr="insight-dashboard-modal-search"
            />
            {quickFilters.length > 0 && (
                <div className="flex gap-2 items-center flex-wrap ml-auto">
                    {quickFilterSet.has('insightType') && (
                        <Select
                            dropdownMatchSelectWidth={false}
                            size="small"
                            active={hasInsightTypeSelection}
                            status={borderless && !hasInsightTypeSelection ? 'alt' : 'default'}
                            onChange={(value) => {
                                setFilters({ insightType: value as string })
                                insights.capture('saved insights filtered', { filter_type: 'insight_type', value })
                            }}
                            options={INSIGHT_TYPE_OPTIONS}
                            value={insightType || 'All types'}
                        />
                    )}
                    {quickFilterSet.has('tags') && (
                        <TagSelect
                            value={tags || []}
                            onChange={(tags) => {
                                setFilters({ tags: tags.length > 0 ? tags : [] })
                                insights.capture('saved insights filtered', { filter_type: 'tags', value: tags })
                            }}
                        >
                            {(selectedTags) => (
                                <Button
                                    size="small"
                                    type="secondary"
                                    active={selectedTags.length > 0}
                                    status={borderless && selectedTags.length === 0 ? 'alt' : 'default'}
                                >
                                    {selectedTags.length > 0 ? `Tags (${selectedTags.length})` : 'Tags'}
                                </Button>
                            )}
                        </TagSelect>
                    )}
                    {quickFilterSet.has('createdBy') && (
                        <MemberSelectMultiplePopover
                            value={createdBy !== 'All users' ? (createdBy as number[]) : []}
                            onChange={(ids) => {
                                const createdByValue = ids.length > 0 ? ids : 'All users'
                                setFilters({ createdBy: createdByValue })
                                insights.capture('saved insights filtered', {
                                    filter_type: 'created_by',
                                    value: createdByValue,
                                })
                            }}
                            borderless={borderless}
                        />
                    )}
                    {quickFilterSet.has('favorites') && (
                        <Button
                            type="secondary"
                            status={borderless && !favorited ? 'alt' : 'default'}
                            active={favorited || false}
                            onClick={() => setFilters({ favorited: !favorited })}
                            size="small"
                            icon={
                                favorited ? (
                                    <IconHeartFilled className="text-danger" />
                                ) : (
                                    <IconHeart className="text-secondary" />
                                )
                            }
                        >
                            Favorites
                        </Button>
                    )}
                    {quickFilterSet.has('featureFlags') && (
                        <FeatureFlagInsightsToggle
                            hideFeatureFlagInsights={hideFeatureFlagInsights ?? undefined}
                            onToggle={(checked) => setFilters({ hideFeatureFlagInsights: checked })}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

const FeatureFlagInsightsToggle = ({
    hideFeatureFlagInsights,
    onToggle,
}: {
    hideFeatureFlagInsights?: boolean
    onToggle: (checked: boolean) => void
}): JSX.Element => {
    return (
        <Tooltip
            title={
                <div>
                    <p>
                        Insights automatically creates insights by default for feature flags to help you understand their
                        performance.
                    </p>
                    <p className="mb-0">
                        Use this toggle to hide these auto-generated insights from your insights list.
                    </p>
                </div>
            }
            placement="top"
        >
            <Button
                icon={<IconFlag />}
                onClick={() => onToggle(!hideFeatureFlagInsights)}
                type="tertiary"
                size="small"
            >
                Hide feature flag insights: <Switch checked={hideFeatureFlagInsights || false} className="ml-1" />
            </Button>
        </Tooltip>
    )
}

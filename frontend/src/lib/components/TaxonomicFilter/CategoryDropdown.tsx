import { useActions, useValues } from 'kea'
import insights from 'insights-js'
import { useCallback } from 'react'

import { IconChevronDown } from '@hanzo/icons'

import { FEATURE_FLAGS } from 'lib/constants'
import { CLICK_OUTSIDE_BLOCK_CLASS } from 'lib/hooks/useOutsideClickHandler'
import { Button } from 'lib/elements/Button'
import { Menu, MenuItem } from 'lib/elements/Menu'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'

import { taxonomicFilterLogic } from './taxonomicFilterLogic'
import { CategoryDropdownVariant, TaxonomicFilterGroupType } from './types'

export function CategoryDropdown({
    variant,
    eventName,
    onAfterChange,
}: {
    variant: Exclude<CategoryDropdownVariant, 'control'>
    eventName?: string
    onAfterChange?: () => void
}): JSX.Element | null {
    const { activeTab, taxonomicGroups, taxonomicGroupTypes } = useValues(taxonomicFilterLogic)
    const { setActiveTab } = useActions(taxonomicFilterLogic)
    const { reportTaxonomicFilterCategorySelected } = useActions(eventUsageLogic)

    const onVisibilityChange = useCallback(
        (visible: boolean) => {
            if (visible) {
                insights.capture('taxonomic filter category dropdown opened', {
                    variant,
                    [`$feature/${FEATURE_FLAGS.TAXONOMIC_FILTER_CATEGORY_DROPDOWN}`]: variant,
                })
            }
        },
        [variant]
    )

    if (taxonomicGroupTypes.length <= 1) {
        return null
    }

    const openTab: TaxonomicFilterGroupType = activeTab ?? taxonomicGroupTypes[0]
    const activeGroup = taxonomicGroups.find((g) => g.type === openTab)
    const activeLabel = activeGroup?.name ?? openTab

    const items: MenuItem[] = taxonomicGroupTypes.map((groupType) => {
        const group = taxonomicGroups.find((g) => g.type === groupType)
        return {
            key: groupType,
            label: group?.name ?? groupType,
            active: groupType === openTab,
            'data-attr': `taxonomic-category-dropdown-item-${groupType}`,
            onClick: () => {
                setActiveTab(groupType)
                reportTaxonomicFilterCategorySelected(groupType, eventName)
                onAfterChange?.()
            },
        }
    })

    const activeItemIndex = taxonomicGroupTypes.findIndex((g) => g === openTab)

    return (
        <Menu
            items={items}
            onVisibilityChange={onVisibilityChange}
            activeItemIndex={activeItemIndex >= 0 ? activeItemIndex : undefined}
            placement="bottom-start"
            className={CLICK_OUTSIDE_BLOCK_CLASS}
        >
            {renderTrigger(variant, activeLabel)}
        </Menu>
    )
}

function renderTrigger(variant: Exclude<CategoryDropdownVariant, 'control'>, activeLabel: string): JSX.Element {
    return (
        <Button
            type="secondary"
            size="xsmall"
            sideIcon={<IconChevronDown />}
            data-attr={`taxonomic-category-dropdown-trigger-${variant}`}
            aria-label={`Current category: ${activeLabel}. Click to change.`}
            className={CLICK_OUTSIDE_BLOCK_CLASS}
        >
            {activeLabel}
        </Button>
    )
}

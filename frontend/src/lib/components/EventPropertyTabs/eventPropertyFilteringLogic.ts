import { connect, kea, path, selectors } from 'kea'

import { userPreferencesLogic } from 'lib/logic/userPreferencesLogic'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'

import { CLOUD_INTERNAL_INSIGHTS_PROPERTY_KEYS, PROPERTY_KEYS } from '~/taxonomy/taxonomy'

import type { eventPropertyFilteringLogicType } from './eventPropertyFilteringLogicType'

export const eventPropertyFilteringLogic = kea<eventPropertyFilteringLogicType>([
    path(['lib', 'components', 'EventPropertyTabs', 'eventPropertyFilteringLogic']),
    connect(() => ({
        values: [userPreferencesLogic, ['hideInsightsPropertiesInTable'], preflightLogic, ['isCloudOrDev']],
    })),
    selectors({
        filterProperties: [
            (s) => [s.hideInsightsPropertiesInTable, s.isCloudOrDev],
            (hideInsightsPropertiesInTable, isCloudOrDev) => {
                return (props: Record<string, any>) => {
                    if (!hideInsightsPropertiesInTable) {
                        return props
                    }

                    return Object.fromEntries(
                        Object.entries(props).filter(([key]) => {
                            const isInsightsProperty = key.startsWith('$') && PROPERTY_KEYS.includes(key)
                            const isNonDollarInsightsProperty =
                                isCloudOrDev && CLOUD_INTERNAL_INSIGHTS_PROPERTY_KEYS.includes(key)
                            const isSystemProperty = props[key]?.system
                            return !isInsightsProperty && !isNonDollarInsightsProperty && !isSystemProperty
                        })
                    )
                }
            },
        ],
    }),
])

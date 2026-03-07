import { actions, connect, kea, listeners, path } from 'kea'
import insights from '@hanzo/insights'

import { isLogEntryPropertyFilter, isValidPropertyFilter } from 'lib/components/PropertyFilters/utils'
import { isActionFilter, isEventFilter } from 'lib/components/UniversalFilters/utils'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { MiniFilterKey } from 'scenes/session-recordings/player/inspector/miniFiltersLogic'
import { InspectorListItemType } from 'scenes/session-recordings/player/inspector/playerInspectorLogic'
import { filtersFromUniversalFilterGroups } from 'scenes/session-recordings/utils'
import { userLogic } from 'scenes/userLogic'

import {
    PropertyFilterType,
    RecordingDurationFilter,
    RecordingUniversalFilters,
    SessionPlayerData,
    SessionRecordingType,
} from '~/types'

import type { sessionRecordingEventUsageLogicType } from './sessionRecordingEventUsageLogicType'

export enum SessionRecordingFilterType {
    Duration = 'duration',
    EventAndAction = 'event_and_action',
    PersonAndCohort = 'person_and_cohort',
    DateRange = 'date_range',
    DurationType = 'duration_type',
}

interface RecordingViewedProps {
    delay: number // Not reported: Number of delayed **seconds** to report event (useful to measure insights where users don't navigate immediately away)
    duration: number // How long is the total recording (milliseconds)
    recording_id: string // Id of the session
    start_time?: number // Start timestamp of the session
    end_time?: number // End timestamp of the session
    snapshot_source: 'web' | 'mobile' | 'unknown'
}

export const sessionRecordingEventUsageLogic = kea<sessionRecordingEventUsageLogicType>([
    path(['scenes', 'session-recordings', 'sessionRecordingEventUsageLogic']),
    connect(() => ({
        values: [preflightLogic, ['realm'], userLogic, ['user']],
    })),
    actions({
        reportRecordingLoaded: (playerData: SessionPlayerData, metadata: SessionRecordingType | null) => ({
            playerData,
            metadata,
        }),
        reportRecordingsListFetched: (
            loadTime: number,
            filters: RecordingUniversalFilters,
            defaultDurationFilter: RecordingDurationFilter
        ) => ({
            loadTime,
            filters,
            defaultDurationFilter,
        }),
        reportRecordingsListPropertiesFetched: (loadTime: number) => ({ loadTime }),
        reportRecordingsListFilterAdded: (filterType: SessionRecordingFilterType) => ({ filterType }),
        reportRecordingPlayerSeekbarEventHovered: true,
        reportRecordingInspectorItemExpanded: (tab: InspectorListItemType, index: number) => ({ tab, index }),
        reportRecordingInspectorMiniFilterViewed: (minifilterKey: MiniFilterKey, enabled: boolean) => ({
            minifilterKey,
            enabled,
        }),
        reportNextRecordingTriggered: (automatic: boolean) => ({
            automatic,
        }),
        reportRecordingExportedToFile: true,
        reportRecordingLoadedFromFile: (data: { success: boolean; error?: string }) => data,
        reportRecordingListVisibilityToggled: (type: string, visible: boolean) => ({ type, visible }),
        reportRecordingPinnedToList: (pinned: boolean) => ({ pinned }),
        reportRecordingPlaylistCreated: (source: 'filters' | 'new' | 'pin' | 'duplicate') => ({ source }),
        reportRecordingOpenedFromRecentRecordingList: true,
    }),
    listeners(() => ({
        reportRecordingLoaded: ({ playerData, metadata }) => {
            const payload: Partial<RecordingViewedProps> = {
                duration: playerData.durationMs,
                recording_id: playerData.sessionRecordingId,
                start_time: playerData.start?.valueOf() ?? 0,
                end_time: playerData.end?.valueOf() ?? 0,
                // older recordings did not store this, and so "null" is equivalent to web,
                // but for reporting we want to distinguish between not loaded and no value to load
                snapshot_source: metadata?.snapshot_source || 'unknown',
            }
            insights.capture(`recording loaded`, payload)
        },
        reportRecordingsListFilterAdded: ({ filterType }) => {
            insights.capture('recording list filter added', { filter_type: filterType })
        },
        reportRecordingsListFetched: ({ loadTime, filters, defaultDurationFilter }) => {
            try {
                const filterValues = filtersFromUniversalFilterGroups(filters)

                const eventFilters = filterValues.filter(isEventFilter)
                const actionFilters = filterValues.filter(isActionFilter)
                const propertyFilters = filterValues.filter(isValidPropertyFilter)
                const consoleLogFilters = propertyFilters.filter(isLogEntryPropertyFilter)

                const filterBreakdown =
                    filters && defaultDurationFilter
                        ? {
                              hasEventsFilters: !!eventFilters.length,
                              hasActionsFilters: !!actionFilters.length,
                              hasPropertiesFilters: !!propertyFilters.length,
                              hasCohortFilter: propertyFilters.some((p) => p.type === PropertyFilterType.Cohort),
                              hasPersonFilter: propertyFilters.some((p) => p.type === PropertyFilterType.Person),
                              hasDurationFilters:
                                  ((filters.duration.length > 0 && filters.duration[0].value) || -1) >
                                  defaultDurationFilter.value,
                              hasConsoleLogsFilters: !!consoleLogFilters.length,
                          }
                        : {}
                insights.capture('recording list fetched', {
                    load_time: loadTime,
                    listing_version: '3',
                    filters,
                    ...filterBreakdown,
                })
            } catch (e) {
                insights.captureException(e, { filters })
            }
        },
        reportRecordingsListPropertiesFetched: ({ loadTime }) => {
            insights.capture('recording list properties fetched', { load_time: loadTime })
        },
        reportRecordingOpenedFromRecentRecordingList: () => {
            insights.capture('recording opened from recent recording list')
        },
        reportRecordingPlayerSeekbarEventHovered: () => {
            insights.capture('recording player seekbar event hovered')
        },
        reportRecordingInspectorItemExpanded: ({ tab, index }) => {
            insights.capture('recording inspector item expanded', { tab: 'replay-4000', type: tab, index })
        },
        reportRecordingInspectorMiniFilterViewed: ({ minifilterKey, enabled }) => {
            insights.capture('recording inspector minifilter selected', { tab: 'replay-4000', enabled, minifilterKey })
        },
        reportNextRecordingTriggered: ({ automatic }) => {
            insights.capture('recording next recording triggered', { automatic })
        },
        reportRecordingExportedToFile: () => {
            insights.capture('recording exported to file')
        },
        reportRecordingLoadedFromFile: (properties) => {
            insights.capture('recording loaded from file', properties)
        },
        reportRecordingListVisibilityToggled: (properties) => {
            insights.capture('recording list visibility toggled', properties)
        },
        reportRecordingPinnedToList: (properties) => {
            insights.capture('recording pinned to list', properties)
        },
        reportRecordingPlaylistCreated: (properties) => {
            insights.capture('recording playlist created', properties)
        },
    })),
])

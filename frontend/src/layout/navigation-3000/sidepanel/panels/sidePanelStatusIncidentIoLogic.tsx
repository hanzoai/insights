import { actions, afterMount, connect, kea, listeners, path, selectors } from 'kea'
import { loaders } from 'kea-loaders'

import { superpowersLogic } from 'lib/components/Superpowers/superpowersLogic'

import type { sidePanelStatusIncidentIoLogicType } from './sidePanelStatusIncidentIoLogicType'

// Status types
export type IncidentIoComponentStatus = 'operational' | 'degraded_performance' | 'partial_outage' | 'full_outage'
export type IncidentIoImpact = 'partial_outage' | 'degraded_performance' | 'full_outage'
export type IncidentIoIncidentStatus = 'investigating' | 'identified' | 'monitoring'
export type IncidentIoMaintenanceStatus = 'maintenance_in_progress' | 'maintenance_scheduled'

export interface IncidentIoAffectedComponent {
    id: string
    name: string
    group_name?: string
    current_status: IncidentIoComponentStatus
}

export interface IncidentIoIncident {
    id: string
    name: string
    status: IncidentIoIncidentStatus
    url: string
    last_update_at: string
    last_update_message: string
    current_worst_impact: IncidentIoImpact
    affected_components: IncidentIoAffectedComponent[]
}

export interface IncidentIoMaintenance {
    id: string
    name: string
    status: IncidentIoMaintenanceStatus
    last_update_at: string
    last_update_message: string
    url: string
    affected_components: IncidentIoAffectedComponent[]
    started_at?: string
    scheduled_end_at?: string
    starts_at?: string
    ends_at?: string
}

export interface IncidentIoSummary {
    page_title: string
    page_url: string
    ongoing_incidents: IncidentIoIncident[]
    in_progress_maintenances: IncidentIoMaintenance[]
    scheduled_maintenances: IncidentIoMaintenance[]
}

// Normalized status for display
export type NormalizedStatus = 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage'

// Where the status DATA comes from: our own API, which serves the summary as
// JSON. It used to be a status-page domain left over from the upstream project —
// one Hanzo does not own and that resolves nowhere, so anyone could have
// registered it and answered this fetch inside a logged-in admin session. Our one
// API front door is api.hanzo.ai, and no path here carries an /api/ prefix.
export const STATUS_SUMMARY_URL = 'https://api.hanzo.ai/v1/summary'

// Where a HUMAN goes to read about an incident: a plain HTML page. This is a
// different thing from the JSON endpoint above and must never be conflated with
// it — one is for the side panel, one is for a person.
export const STATUS_PAGE_URL = 'https://status.hanzo.ai'

export const REFRESH_INTERVAL = 60 * 1000 * 5 // 5 minutes

// The API returns the incidents that apply to THIS platform, so the client
// renders what it is given.
//
// It used to re-filter them by a region group_name ('US Cloud 🇺🇸' / 'EU Cloud
// 🇪🇺') taken from a hostname map — upstream multi-region SaaS logic Hanzo does
// not have. The map had both of its real entries under the same key, so only the
// last one survived and every incident whose components were not tagged 'EU Cloud
// 🇪🇺' was silently dropped. Deciding which incidents are relevant is the server's
// job now; there is no second region to filter out.
function worstStatus(summary: IncidentIoSummary): NormalizedStatus {
    const hasOngoingIncidents = summary.ongoing_incidents.length > 0
    const hasInProgressMaintenance = summary.in_progress_maintenances.length > 0

    if (!hasOngoingIncidents && !hasInProgressMaintenance) {
        return 'operational'
    }

    for (const incident of summary.ongoing_incidents) {
        if (incident.current_worst_impact === 'full_outage') {
            return 'major_outage'
        }
    }

    for (const incident of summary.ongoing_incidents) {
        if (incident.current_worst_impact === 'partial_outage') {
            return 'partial_outage'
        }
    }

    for (const incident of summary.ongoing_incidents) {
        if (incident.current_worst_impact === 'degraded_performance') {
            return 'degraded_performance'
        }
    }

    // If only maintenance is in progress, show as degraded
    if (hasInProgressMaintenance) {
        return 'degraded_performance'
    }

    return 'operational'
}

export const sidePanelStatusIncidentIoLogic = kea<sidePanelStatusIncidentIoLogicType>([
    path(['scenes', 'navigation', 'sidepanel', 'sidePanelStatusIncidentIoLogic']),

    connect(() => ({
        values: [superpowersLogic, ['fakeStatusOverride', 'superpowersEnabled']],
    })),

    actions({
        setPageVisibility: (visible: boolean) => ({ visible }),
    }),

    loaders(() => ({
        summary: [
            null as IncidentIoSummary | null,
            {
                loadSummary: async () => {
                    const response = await fetch(STATUS_SUMMARY_URL)
                    const data: IncidentIoSummary = await response.json()
                    return data
                },
            },
        ],
    })),

    selectors({
        rawStatus: [
            (s) => [s.summary],
            (summary: IncidentIoSummary | null): NormalizedStatus => {
                if (!summary) {
                    return 'operational'
                }
                return worstStatus(summary)
            },
        ],
        status: [
            (s) => [s.rawStatus, s.fakeStatusOverride, s.superpowersEnabled],
            (rawStatus, fakeStatusOverride, superpowersEnabled): NormalizedStatus => {
                if (superpowersEnabled && fakeStatusOverride !== 'none') {
                    return fakeStatusOverride as NormalizedStatus
                }
                return rawStatus
            },
        ],
        statusDescription: [
            (s) => [s.summary, s.status],
            (summary, status): string | null => {
                if (!summary) {
                    return null
                }
                if (status === 'operational') {
                    return 'All systems operational'
                }
                const incidentCount = summary.ongoing_incidents.length
                const maintenanceCount = summary.in_progress_maintenances.length
                if (incidentCount > 0) {
                    return `${incidentCount} ongoing incident${incidentCount > 1 ? 's' : ''}`
                }
                if (maintenanceCount > 0) {
                    return `${maintenanceCount} maintenance${maintenanceCount > 1 ? 's' : ''} in progress`
                }
                return 'All systems operational'
            },
        ],
    }),

    listeners(({ actions, cache }) => ({
        loadSummarySuccess: () => {
            cache.disposables.add(() => {
                const timerId = setTimeout(() => actions.loadSummary(), REFRESH_INTERVAL)
                return () => clearTimeout(timerId)
            }, 'refreshTimeout')
        },
        setPageVisibility: ({ visible }) => {
            if (visible) {
                actions.loadSummary()
            } else {
                cache.disposables.dispose('refreshTimeout')
            }
        },
    })),

    afterMount(({ actions, cache }) => {
        actions.loadSummary()
        cache.disposables.add(() => {
            const onVisibilityChange = (): void => {
                actions.setPageVisibility(document.visibilityState === 'visible')
            }
            document.addEventListener('visibilitychange', onVisibilityChange)
            return () => document.removeEventListener('visibilitychange', onVisibilityChange)
        }, 'visibilityListener')
    }),
])

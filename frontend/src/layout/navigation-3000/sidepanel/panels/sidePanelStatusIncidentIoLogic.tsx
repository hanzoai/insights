import { connect, kea, path, reducers, selectors } from 'kea'

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

// There is no incident feed to read: api.hanzo.ai serves no status summary, and
// polling an address that answers 404 only put an error in every console. With
// no summary the widgets report nothing beyond a superpowers drill.

// Where a HUMAN goes to read about an incident: a plain HTML page.
export const STATUS_PAGE_URL = 'https://status.hanzo.ai'

// The API returns the incidents that apply to THIS platform, so the client
// renders what it is given.
//
// It used to re-filter them by a region group_name ('US Cloud 🇺🇸' / 'EU Cloud
// 🇪🇺') taken from a hostname map — upstream multi-region SaaS logic Hanzo does
// not have. The map had both of its real entries under the same key, so only the
// last one survived and every incident whose components were not tagged 'EU Cloud
// 🇪🇺' was silently dropped. Deciding which incidents are relevant is the server's
// job now; there is no second region to filter out.
export function worstStatus(summary: IncidentIoSummary): NormalizedStatus {
    // Read through empty defaults rather than trusting the shape. This value is
    // consumed by the navigation, so a throw in here does not break a widget --
    // it unmounts the entire product, nav included. Nothing about reporting the
    // platform's health is worth that, so the unhappy answer is 'operational'
    // and a quiet widget.
    const ongoing = summary.ongoing_incidents ?? []
    const maintenances = summary.in_progress_maintenances ?? []

    const hasOngoingIncidents = ongoing.length > 0
    const hasInProgressMaintenance = maintenances.length > 0

    if (!hasOngoingIncidents && !hasInProgressMaintenance) {
        return 'operational'
    }

    for (const incident of ongoing) {
        if (incident.current_worst_impact === 'full_outage') {
            return 'major_outage'
        }
    }

    for (const incident of ongoing) {
        if (incident.current_worst_impact === 'partial_outage') {
            return 'partial_outage'
        }
    }

    for (const incident of ongoing) {
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

    reducers({
        summary: [null as IncidentIoSummary | null, {}],
    }),

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
                const incidentCount = (summary.ongoing_incidents ?? []).length
                const maintenanceCount = (summary.in_progress_maintenances ?? []).length
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
])

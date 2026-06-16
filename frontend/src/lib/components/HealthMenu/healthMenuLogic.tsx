import { actions, connect, kea, path, reducers, selectors } from 'kea'

import { superpowersLogic } from 'lib/components/Superpowers/superpowersLogic'
import { capitalizeFirstLetter } from 'lib/utils'

import { sidePanelStatusIncidentIoLogic } from '~/layout/navigation-3000/sidepanel/panels/sidePanelStatusIncidentIoLogic'

import type { healthMenuLogicType } from './healthMenuLogicType'

export type InsightsStatusType = 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage'
export type InsightsStatusBadgeStatus = 'success' | 'warning' | 'danger'

export const healthMenuLogic = kea<healthMenuLogicType>([
    path(['lib', 'components', 'HealthMenu', 'healthMenuLogic']),
    connect({
        values: [
            sidePanelStatusIncidentIoLogic,
            ['status', 'statusDescription'],
            superpowersLogic,
            ['fakeStatusOverride', 'superpowersEnabled'],
        ],
    }),
    actions({
        setHealthMenuOpen: (isOpen: boolean) => ({ isOpen }),
        toggleHealthMenu: true,
    }),
    reducers({
        isHealthMenuOpen: [
            false,
            {
                setHealthMenuOpen: (_, { isOpen }) => isOpen,
                toggleHealthMenu: (state) => !state,
            },
        ],
    }),
    selectors({
        insightsStatus: [(s) => [s.status], (status): InsightsStatusType => status],
        isFakeStatus: [
            (s) => [s.superpowersEnabled, s.fakeStatusOverride],
            (superpowersEnabled, fakeStatusOverride): boolean => !!superpowersEnabled && fakeStatusOverride !== 'none',
        ],
        insightsStatusTooltip: [
            (s) => [s.statusDescription, s.isFakeStatus, s.insightsStatus],
            (statusDescription, isFakeStatus, insightsStatus): string | null => {
                if (isFakeStatus) {
                    return `[DRILL] ${capitalizeFirstLetter(insightsStatus.replace(/_/g, ' '))}`
                }
                return statusDescription
            },
        ],
        insightsStatusBadgeContent: [
            (s) => [s.insightsStatus],
            (insightsStatus): string => (insightsStatus !== 'operational' ? '!' : '✓'),
        ],
        insightsStatusBadgeStatus: [
            (s) => [s.insightsStatus],
            (insightsStatus): InsightsStatusBadgeStatus => {
                if (insightsStatus.includes('outage')) {
                    return 'danger'
                }
                if (insightsStatus.includes('degraded') || insightsStatus.includes('monitoring')) {
                    return 'warning'
                }
                return 'success'
            },
        ],
    }),
])

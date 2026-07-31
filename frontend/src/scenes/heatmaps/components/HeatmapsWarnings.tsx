import { useActions, useValues } from 'kea'

import { IconGear } from '@hanzo/icons'
import { Banner } from '@hanzo/elements'

import { teamLogic } from 'scenes/teamLogic'

import { sidePanelSettingsLogic } from '~/layout/navigation-3000/sidepanel/panels/sidePanelSettingsLogic'

export function HeatmapsWarnings(): JSX.Element | null {
    const { currentTeam } = useValues(teamLogic)
    const heatmapsEnabled = currentTeam?.heatmaps_opt_in

    const { openSettingsPanel } = useActions(sidePanelSettingsLogic)

    return !heatmapsEnabled ? (
        <Banner
            type="warning"
            action={{
                type: 'secondary',
                icon: <IconGear />,
                onClick: () => openSettingsPanel({ sectionId: 'environment-autocapture', settingId: 'heatmaps' }),
                children: 'Configure',
            }}
            dismissKey="heatmaps-might-be-disabled-warning"
        >
            You aren't collecting heatmaps data. Enable heatmaps in your project.
        </Banner>
    ) : null
}

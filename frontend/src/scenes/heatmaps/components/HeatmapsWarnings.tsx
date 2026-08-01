import { useValues } from 'kea'

import { IconGear } from '@hanzo/icons'
import { Banner } from '@hanzo/elements'

import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'

export function HeatmapsWarnings(): JSX.Element | null {
    const { currentTeam } = useValues(teamLogic)
    const heatmapsEnabled = currentTeam?.heatmaps_opt_in

    return !heatmapsEnabled ? (
        <Banner
            type="warning"
            action={{
                type: 'secondary',
                icon: <IconGear />,
                to: urls.settings('environment-heatmaps', 'heatmaps'),
                children: 'Configure',
            }}
            dismissKey="heatmaps-might-be-disabled-warning"
        >
            You aren't collecting heatmaps data. Enable heatmaps in your project.
        </Banner>
    ) : null
}

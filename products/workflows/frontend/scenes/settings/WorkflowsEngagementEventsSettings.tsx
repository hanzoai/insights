import { useActions, useValues } from 'kea'

import { Switch } from '@hanzo/elements'

import { teamLogic } from 'scenes/teamLogic'

export function WorkflowsEngagementEventsSettings(): JSX.Element {
    const { currentTeam, currentTeamLoading } = useValues(teamLogic)
    const { updateCurrentTeam } = useActions(teamLogic)

    const enabled = !!currentTeam?.workflows_config?.capture_workflows_engagement_events

    return (
        <Switch
            id="workflows-capture-engagement-events"
            onChange={(checked) => {
                updateCurrentTeam({
                    workflows_config: {
                        ...currentTeam?.workflows_config,
                        capture_workflows_engagement_events: checked,
                    },
                })
            }}
            checked={enabled}
            disabled={currentTeamLoading}
            label="Capture email engagement events"
            bordered
        />
    )
}

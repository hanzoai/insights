import { useActions, useValues } from 'kea'

import { Switch } from '@hanzo/elements'

import { webAnalyticsAchievementsPreferencesLogic } from 'scenes/web-analytics/achievements/webAnalyticsAchievementsPreferencesLogic'

export function WebAnalyticsAchievementsSetting(): JSX.Element {
    const { achievementsOptOut, preferencesLoading } = useValues(webAnalyticsAchievementsPreferencesLogic)
    const { setAchievementsOptOut } = useActions(webAnalyticsAchievementsPreferencesLogic)

    return (
        <Switch
            onChange={(checked) => setAchievementsOptOut({ optedOut: !checked })}
            checked={!achievementsOptOut}
            loading={preferencesLoading}
            label="Show Web analytics achievements"
            bordered
        />
    )
}

import { useFeatureFlag } from 'lib/hooks/useFeatureFlag'
import { LinkedCustomFunctions } from 'scenes/custom-functions/list/LinkedCustomFunctions'

export function ErrorTrackingAlerting(): JSX.Element {
    const hasSpikeAlertingFeatureFlag = useFeatureFlag('ERROR_TRACKING_SPIKE_ALERTING')

    return (
        <LinkedCustomFunctions
            type="internal_destination"
            subTemplateIds={[
                'error-tracking-issue-created',
                'error-tracking-issue-reopened',
                ...(hasSpikeAlertingFeatureFlag ? (['error-tracking-issue-spiking'] as const) : []),
            ]}
        />
    )
}

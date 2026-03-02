import { useActions, useValues } from 'kea'

import { LemonSwitch, LemonTag } from '@posthog/lemon-ui'

import { InsightsFunctionStatusIndicator } from 'scenes/insights-functions/misc/InsightsFunctionStatusIndicator'
import { InsightsFunctionStatusTag } from 'scenes/insights-functions/misc/InsightsFunctionStatusTag'

import { insightsFunctionConfigurationLogic } from '../insightsFunctionConfigurationLogic'

export function InsightsFunctionEnabledConfig(): JSX.Element {
    const { configuration, loading, insightsFunction, template } = useValues(insightsFunctionConfigurationLogic)
    const { setConfigurationValue } = useActions(insightsFunctionConfigurationLogic)

    return (
        <div className="flex items-center gap-2">
            {template && <InsightsFunctionStatusTag status={template.status} />}
            {insightsFunction ? (
                <InsightsFunctionStatusIndicator insightsFunction={insightsFunction} />
            ) : (
                <LemonTag type={configuration.enabled ? 'success' : 'default'}>
                    {configuration.enabled ? 'Start enabled' : 'Start paused'}
                </LemonTag>
            )}
            <LemonSwitch
                onChange={() => setConfigurationValue('enabled', !configuration.enabled)}
                checked={configuration.enabled}
                disabled={loading}
                tooltip={
                    <>
                        {configuration.enabled
                            ? 'Enabled. Events will be processed.'
                            : 'Disabled. Events will not be processed.'}
                    </>
                }
            />
        </div>
    )
}

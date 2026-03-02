import { useActions, useValues } from 'kea'

import { LemonSwitch, LemonTag } from '@posthog/lemon-ui'

import { CustomFunctionStatusIndicator } from 'scenes/custom-functions/misc/CustomFunctionStatusIndicator'
import { CustomFunctionStatusTag } from 'scenes/custom-functions/misc/CustomFunctionStatusTag'

import { customFunctionConfigurationLogic } from '../customFunctionConfigurationLogic'

export function CustomFunctionEnabledConfig(): JSX.Element {
    const { configuration, loading, customFunction, template } = useValues(customFunctionConfigurationLogic)
    const { setConfigurationValue } = useActions(customFunctionConfigurationLogic)

    return (
        <div className="flex items-center gap-2">
            {template && <CustomFunctionStatusTag status={template.status} />}
            {customFunction ? (
                <CustomFunctionStatusIndicator customFunction={customFunction} />
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

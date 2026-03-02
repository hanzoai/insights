import { useActions, useValues } from 'kea'

import { LemonButton } from '@posthog/lemon-ui'

import { customFunctionConfigurationLogic } from '../customFunctionConfigurationLogic'

export function CustomFunctionConfigurationSaveButton(): JSX.Element {
    const {
        configuration,
        configurationChanged,
        template,
        isConfigurationSubmitting,
        willReEnableOnSave,
        willChangeEnabledOnSave,
        customFunction,
    } = useValues(customFunctionConfigurationLogic)
    const { submitConfiguration } = useActions(customFunctionConfigurationLogic)
    return (
        <LemonButton
            type="primary"
            htmlType="submit"
            onClick={submitConfiguration}
            loading={isConfigurationSubmitting}
            disabledReason={!configurationChanged && customFunction ? 'No changes' : undefined}
            size="small"
        >
            {template ? 'Create' : 'Save'}
            {willReEnableOnSave
                ? ' & re-enable'
                : willChangeEnabledOnSave
                  ? ` & ${configuration.enabled ? 'enable' : 'disable'}`
                  : ''}
        </LemonButton>
    )
}

export function CustomFunctionConfigurationClearChangesButton(): JSX.Element | null {
    const { configurationChanged, isConfigurationSubmitting } = useValues(customFunctionConfigurationLogic)
    const { resetForm } = useActions(customFunctionConfigurationLogic)

    if (!configurationChanged) {
        return null
    }

    return (
        <LemonButton
            type="secondary"
            htmlType="reset"
            onClick={() => resetForm()}
            disabledReason={
                !configurationChanged ? 'No changes' : isConfigurationSubmitting ? 'Saving in progress…' : undefined
            }
            size="small"
        >
            Clear changes
        </LemonButton>
    )
}

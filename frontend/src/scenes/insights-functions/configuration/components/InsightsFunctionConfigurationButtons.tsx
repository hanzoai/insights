import { useActions, useValues } from 'kea'

import { Button } from '@hanzo/elements'

import { insightsFunctionConfigurationLogic } from '../insightsFunctionConfigurationLogic'

export function InsightsFunctionConfigurationSaveButton(): JSX.Element {
    const {
        configuration,
        configurationChanged,
        template,
        isConfigurationSubmitting,
        willReEnableOnSave,
        willChangeEnabledOnSave,
        insightsFunction,
    } = useValues(insightsFunctionConfigurationLogic)
    const { submitConfiguration } = useActions(insightsFunctionConfigurationLogic)
    return (
        <Button
            type="primary"
            htmlType="submit"
            onClick={submitConfiguration}
            loading={isConfigurationSubmitting}
            disabledReason={!configurationChanged && insightsFunction ? 'No changes' : undefined}
            size="small"
        >
            {template ? 'Create' : 'Save'}
            {willReEnableOnSave
                ? ' & re-enable'
                : willChangeEnabledOnSave
                  ? ` & ${configuration.enabled ? 'enable' : 'disable'}`
                  : ''}
        </Button>
    )
}

export function InsightsFunctionConfigurationClearChangesButton(): JSX.Element | null {
    const { configurationChanged, isConfigurationSubmitting } = useValues(insightsFunctionConfigurationLogic)
    const { resetForm } = useActions(insightsFunctionConfigurationLogic)

    if (!configurationChanged) {
        return null
    }

    return (
        <Button
            type="secondary"
            htmlType="reset"
            onClick={() => resetForm()}
            disabledReason={
                !configurationChanged ? 'No changes' : isConfigurationSubmitting ? 'Saving in progress…' : undefined
            }
            size="small"
        >
            Clear changes
        </Button>
    )
}

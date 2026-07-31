import { useActions, useValues } from 'kea'

import { Button } from 'lib/elements/Button'

import { batchExportConfigurationLogic, getDefaultConfiguration } from './batchExportConfigurationLogic'

export function BatchExportConfigurationSaveButton(): JSX.Element {
    const { isNew, isConfigurationSubmitting, configurationChanged } = useValues(batchExportConfigurationLogic)
    const { submitConfiguration } = useActions(batchExportConfigurationLogic)
    return (
        <Button
            type="primary"
            htmlType="submit"
            onClick={submitConfiguration}
            loading={isConfigurationSubmitting}
            disabledReason={
                !configurationChanged
                    ? 'No changes to save'
                    : isConfigurationSubmitting
                      ? 'Saving in progress…'
                      : undefined
            }
            size="small"
        >
            {isNew ? 'Create' : 'Save'}
        </Button>
    )
}

export function BatchExportConfigurationClearChangesButton(): JSX.Element | null {
    const { isNew, isConfigurationSubmitting, configurationChanged, savedConfiguration, service } =
        useValues(batchExportConfigurationLogic)
    const { resetConfiguration } = useActions(batchExportConfigurationLogic)

    if (!configurationChanged) {
        return null
    }

    return (
        <Button
            type="secondary"
            htmlType="reset"
            onClick={() =>
                isNew && service
                    ? resetConfiguration(getDefaultConfiguration(service))
                    : resetConfiguration(savedConfiguration)
            }
            disabledReason={
                !configurationChanged ? 'No changes' : isConfigurationSubmitting ? 'Saving in progress…' : undefined
            }
            size="small"
        >
            {isNew ? 'Reset' : 'Clear changes'}
        </Button>
    )
}

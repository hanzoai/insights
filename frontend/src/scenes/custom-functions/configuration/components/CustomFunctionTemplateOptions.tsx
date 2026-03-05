import { useActions, useValues } from 'kea'

import { LemonButton } from '@posthog/lemon-ui'

import { customFunctionConfigurationLogic } from '../customFunctionConfigurationLogic'

export function CustomFunctionTemplateOptions(): JSX.Element {
    const { customFunction, templateHasChanged } = useValues(customFunctionConfigurationLogic)

    const { resetToTemplate, duplicateFromTemplate } = useActions(customFunctionConfigurationLogic)
    return (
        <div className="p-1 max-w-120">
            <p>
                This function was built from the template <b>{customFunction?.template?.name}</b>.
                {templateHasChanged ? (
                    <>
                        <br />
                        It has different code to the latest version, either due to custom modifications or updates to
                        the template.
                    </>
                ) : null}
            </p>

            <div className="flex flex-1 gap-2 items-center pt-2 border-t">
                <div className="flex-1">
                    <LemonButton>Close</LemonButton>
                </div>

                <LemonButton
                    type="secondary"
                    onClick={() => duplicateFromTemplate()}
                    tooltip="Create a new destination using the latest template version"
                >
                    New function from template
                </LemonButton>

                {templateHasChanged ? (
                    <LemonButton
                        type="primary"
                        onClick={() => resetToTemplate()}
                        tooltip="Replace your current code with the latest template version"
                    >
                        Reset to template
                    </LemonButton>
                ) : null}
            </div>
        </div>
    )
}

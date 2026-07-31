import { useActions, useValues } from 'kea'

import { Button } from '@hanzo/elements'

import { insightsFunctionConfigurationLogic } from '../insightsFunctionConfigurationLogic'

export function InsightsFunctionTemplateOptions(): JSX.Element {
    const { insightsFunction, templateHasChanged } = useValues(insightsFunctionConfigurationLogic)

    const { resetToTemplate, duplicateFromTemplate } = useActions(insightsFunctionConfigurationLogic)
    return (
        <div className="p-1 max-w-120">
            <p>
                This function was built from the template <b>{insightsFunction?.template?.name}</b>.
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
                    <Button>Close</Button>
                </div>

                <Button
                    type="secondary"
                    onClick={() => duplicateFromTemplate()}
                    tooltip="Create a new destination using the latest template version"
                >
                    New function from template
                </Button>

                {templateHasChanged ? (
                    <Button
                        type="primary"
                        onClick={() => resetToTemplate()}
                        tooltip="Replace your current code with the latest template version"
                    >
                        Reset to template
                    </Button>
                ) : null}
            </div>
        </div>
    )
}

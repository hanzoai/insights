import { useValues } from 'kea'

import { Banner } from '@hanzo/elements'

import { workflowLogic } from '../../../workflowLogic'
import { insightsFlowEditorLogic } from '../../insightsFlowEditorLogic'

export function StepSchemaErrors(): JSX.Element | null {
    const { selectedNode } = useValues(insightsFlowEditorLogic)
    const { actionValidationErrorsById } = useValues(workflowLogic)
    const validationResult = actionValidationErrorsById[selectedNode?.id ?? '']

    if (!validationResult?.schema) {
        return null
    }

    return (
        <div className="flex flex-col gap-1">
            {Object.values(validationResult.schema.errors).map(({ path, message }) => (
                <Banner type="error" key={path.join('.')}>
                    {path.join('.')}: {message}
                </Banner>
            ))}
        </div>
    )
}

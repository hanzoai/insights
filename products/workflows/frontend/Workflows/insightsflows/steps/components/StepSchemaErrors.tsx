import { useValues } from 'kea'

import { LemonBanner } from '@hanzo/lemon-ui'

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
                <LemonBanner type="error" key={path.join('.')}>
                    {path.join('.')}: {message}
                </LemonBanner>
            ))}
        </div>
    )
}

import { useValues } from 'kea'

import { LemonBanner } from '@posthog/lemon-ui'

import { workflowLogic } from '../../../workflowLogic'
import { customFlowEditorLogic } from '../../customFlowEditorLogic'

export function StepSchemaErrors(): JSX.Element | null {
    const { selectedNode } = useValues(customFlowEditorLogic)
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

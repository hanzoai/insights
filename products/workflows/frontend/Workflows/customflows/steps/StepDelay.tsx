import { Node } from '@xyflow/react'
import { useActions, useValues } from 'kea'

import { workflowLogic } from '../../workflowLogic'
import { CustomFlowAction } from '../types'
import { CustomFlowDuration } from './components/CustomFlowDuration'
import { StepSchemaErrors } from './components/StepSchemaErrors'
import { stepDelayLogic } from './stepDelayLogic'

export function StepDelayConfiguration({
    node,
}: {
    node: Node<Extract<CustomFlowAction, { type: 'delay' }>>
}): JSX.Element {
    const action = node.data
    const { delay_duration } = action.config

    const { logicProps } = useValues(workflowLogic)
    const { setDelayWorkflowActionConfig } = useActions(stepDelayLogic({ workflowLogicProps: logicProps }))

    return (
        <>
            <StepSchemaErrors />

            <p className="mb-0">Wait for a specified duration.</p>
            <CustomFlowDuration
                value={delay_duration}
                onChange={(value) => {
                    setDelayWorkflowActionConfig(action.id, { delay_duration: value })
                }}
            />
        </>
    )
}

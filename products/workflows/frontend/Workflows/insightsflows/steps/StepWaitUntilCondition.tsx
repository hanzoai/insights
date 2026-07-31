import { Node } from '@xyflow/react'
import { useActions } from 'kea'

import { Label } from '@hanzo/elements'

import { Input } from 'lib/elements/Input'

import { workflowLogic } from '../../workflowLogic'
import { InsightsFlowPropertyFilters } from '../filters/InsightsFlowFilters'
import { InsightsFlowAction } from '../types'
import { InsightsFlowDuration } from './components/InsightsFlowDuration'
import { StepSchemaErrors } from './components/StepSchemaErrors'
import { useDebouncedNameInput } from './utils'

export function StepWaitUntilConditionConfiguration({
    node,
}: {
    node: Node<Extract<InsightsFlowAction, { type: 'wait_until_condition' }>>
}): JSX.Element {
    const action = node.data
    const { condition, max_wait_duration } = action.config

    const { partialSetWorkflowActionConfig } = useActions(workflowLogic)

    const { localName: localConditionName, handleNameChange } = useDebouncedNameInput(condition, (updatedCondition) =>
        partialSetWorkflowActionConfig(action.id, { condition: updatedCondition })
    )

    return (
        <>
            <StepSchemaErrors />

            <div className="flex flex-col gap-1">
                <Label>Wait time</Label>
                <InsightsFlowDuration
                    value={max_wait_duration}
                    onChange={(value) => {
                        partialSetWorkflowActionConfig(action.id, { max_wait_duration: value })
                    }}
                />
            </div>

            <div className="flex flex-col gap-1">
                <Label>Conditions to wait for</Label>
                <Input
                    value={localConditionName || ''}
                    onChange={handleNameChange}
                    placeholder="If condition matches"
                    size="small"
                />
                <InsightsFlowPropertyFilters
                    filtersKey={`wait-until-condition-${action.id}`}
                    filters={condition.filters ?? {}}
                    setFilters={(filters) =>
                        partialSetWorkflowActionConfig(action.id, { condition: { ...condition, filters } })
                    }
                    typeKey="workflow-wait-until-condition"
                />
            </div>
        </>
    )
}

import { Node } from '@xyflow/react'
import { useActions } from 'kea'

import { IconCursor, IconPerson } from '@hanzo/icons'
import { Divider, Label } from '@hanzo/elements'

import { Input } from 'lib/elements/Input'

import { workflowLogic } from '../../workflowLogic'
import { InsightsFlowEventFilters, InsightsFlowPropertyFilters } from '../filters/InsightsFlowFilters'
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
    const { condition, events, max_wait_duration } = action.config

    const { partialSetWorkflowActionConfig } = useActions(workflowLogic)

    const { localName: localConditionName, handleNameChange } = useDebouncedNameInput(condition, (updatedCondition) =>
        partialSetWorkflowActionConfig(action.id, { condition: updatedCondition })
    )

    const eventFilters = events?.[0]?.filters ?? {}

    return (
        <>
            <StepSchemaErrors />

            <div className="flex flex-col gap-3">
                <span className="flex gap-1">
                    <IconCursor className="text-lg" />
                    <span className="text-md font-semibold">Events to wait for</span>
                </span>
                <span className="text-xs text-muted">
                    The workflow continues on the matched path when any of these events fire.
                </span>
                <InsightsFlowEventFilters
                    filtersKey={`wait-until-events-${action.id}`}
                    filters={eventFilters}
                    setFilters={(newFilters) =>
                        partialSetWorkflowActionConfig(action.id, {
                            events: newFilters ? [{ filters: newFilters }] : undefined,
                        })
                    }
                    typeKey="workflow-wait-until-event"
                    buttonCopy="Add event"
                    excludeGroupProperties
                />
            </div>

            <div className="flex items-center gap-4 my-2">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-tertiary uppercase tracking-wide">or</span>
                <div className="flex-1 border-t border-border" />
            </div>

            <div className="flex flex-col gap-3">
                <span className="flex gap-1">
                    <IconPerson className="text-lg" />
                    <span className="text-md font-semibold">Property conditions</span>
                </span>
                <span className="text-xs text-muted">
                    The workflow continues when the person matches these properties.
                </span>
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
                    excludeGroupProperties
                />
            </div>

            <Divider />

            <div className="flex flex-col gap-1">
                <Label>Max time to wait</Label>
                <InsightsFlowDuration
                    value={max_wait_duration}
                    onChange={(value) => {
                        partialSetWorkflowActionConfig(action.id, { max_wait_duration: value })
                    }}
                />
            </div>
        </>
    )
}

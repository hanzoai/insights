import { Node } from '@xyflow/react'
import { useActions, useValues } from 'kea'
import { useMemo } from 'react'

import { IconPlus, IconX } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input'
import { Label } from 'lib/elements/Label'

import { InsightsFlowPropertyFilters } from '../filters/InsightsFlowFilters'
import { hogFlowEditorLogic } from '../hogFlowEditorLogic'
import { InsightsFlow, InsightsFlowAction } from '../types'
import { StepSchemaErrors } from './components/StepSchemaErrors'
import { getBranchRemovalDisabledReason, removeBranchEdge, useDebouncedNameInputs } from './utils'

export function StepConditionalBranchConfiguration({
    node,
}: {
    node: Node<Extract<InsightsFlowAction, { type: 'conditional_branch' }>>
}): JSX.Element {
    const action = node.data
    const conditions = action.config.conditions ?? []

    const { edgesByActionId } = useValues(hogFlowEditorLogic)
    const { setWorkflowAction, setWorkflowActionEdges } = useActions(hogFlowEditorLogic)

    const nodeEdges = edgesByActionId[action.id] ?? []

    const setConditions = (
        conditions: Extract<InsightsFlowAction, { type: 'conditional_branch' }>['config']['conditions']
    ): void => {
        // For condition modifiers we need to setup the branches as well
        setWorkflowAction(action.id, {
            ...action,
            config: { ...action.config, conditions },
        })
    }

    const { localNames: localConditionNames, handleNameChange } = useDebouncedNameInputs(conditions, setConditions)

    const [branchEdges, nonBranchEdges] = useMemo(() => {
        const branchEdges: InsightsFlow['edges'] = []
        const nonBranchEdges: InsightsFlow['edges'] = []

        nodeEdges?.forEach((edge) => {
            if (edge.type === 'branch' && edge.from === action.id) {
                branchEdges.push(edge)
            } else {
                nonBranchEdges.push(edge)
            }
        })

        return [branchEdges.sort((a, b) => (a.index ?? 0) - (b.index ?? 0)), nonBranchEdges]
    }, [nodeEdges, action.id])

    const continueEdge = nodeEdges.find((edge) => edge.type === 'continue' && edge.from === action.id)

    const addCondition = (): void => {
        if (!continueEdge) {
            throw new Error('Continue edge not found')
        }

        setConditions([...conditions, { filters: {} }])
        setWorkflowActionEdges(action.id, [
            ...branchEdges,
            {
                from: action.id,
                to: continueEdge.to,
                type: 'branch',
                index: conditions.length,
            },
            ...nonBranchEdges,
        ])
    }

    const removeCondition = (index: number): void => {
        setConditions(conditions.filter((_, i) => i !== index))
        // Branch edges come first as they are sorted to show on the left
        setWorkflowActionEdges(action.id, [...removeBranchEdge(branchEdges, index), ...nonBranchEdges])
    }

    return (
        <>
            <StepSchemaErrors />
            {conditions.map((condition, index) => (
                <div key={index} className="flex flex-col gap-2 p-2 rounded border">
                    <div className="flex justify-between items-center">
                        <Label>Condition {index + 1}</Label>
                        <Button
                            size="xsmall"
                            icon={<IconX />}
                            onClick={() => removeCondition(index)}
                            disabledReason={getBranchRemovalDisabledReason(branchEdges, index, edgesByActionId)}
                        />
                    </div>

                    <InsightsFlowPropertyFilters
                        filtersKey={`condition-branch-condition-${action.id}-${index}`}
                        filters={condition.filters ?? {}}
                        setFilters={(filters) =>
                            setConditions(
                                conditions.map((condition, i) =>
                                    i === index ? { ...condition, filters: filters ?? {} } : condition
                                )
                            )
                        }
                        typeKey={`workflow-trigger-${index}`}
                    />

                    <Field.Pure label="Condition name (optional)">
                        <Input
                            value={localConditionNames[index] || ''}
                            onChange={(value) => handleNameChange(index, value)}
                            placeholder={`If condition #${index + 1} matches`}
                            size="small"
                        />
                    </Field.Pure>
                </div>
            ))}

            <Button type="secondary" icon={<IconPlus />} onClick={() => addCondition()} className="mt-2">
                Add condition
            </Button>
        </>
    )
}

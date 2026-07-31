import { Node } from '@xyflow/react'
import { useActions, useValues } from 'kea'
import { useMemo } from 'react'

import { IconBalance, IconPlus, IconX } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'
import { Input } from 'lib/elements/Input'
import { Label } from 'lib/elements/Label'

import { insightsFlowEditorLogic } from '../insightsFlowEditorLogic'
import { InsightsFlow, InsightsFlowAction } from '../types'
import { StepSchemaErrors } from './components/StepSchemaErrors'
import { useDebouncedNameInputs } from './utils'

export function StepRandomCohortBranchConfiguration({
    node,
}: {
    node: Node<Extract<InsightsFlowAction, { type: 'random_cohort_branch' }>>
}): JSX.Element {
    const action = node.data
    const { cohorts } = action.config

    const { edgesByActionId } = useValues(insightsFlowEditorLogic)
    const { setWorkflowAction, setWorkflowActionEdges } = useActions(insightsFlowEditorLogic)

    const nodeEdges = edgesByActionId[action.id] ?? []

    const setCohorts = (
        cohorts: Extract<InsightsFlowAction, { type: 'random_cohort_branch' }>['config']['cohorts']
    ): void => {
        setWorkflowAction(action.id, {
            ...action,
            config: { ...action.config, cohorts },
        })
    }

    const { localNames: localCohortNames, handleNameChange } = useDebouncedNameInputs(cohorts, setCohorts)

    const [branchEdges, nonBranchEdges] = useMemo(() => {
        const branchEdges: InsightsFlow['edges'] = []
        const nonBranchEdges: InsightsFlow['edges'] = []

        nodeEdges.forEach((edge) => {
            if (edge.type === 'branch' && edge.from === action.id) {
                branchEdges.push(edge)
            } else {
                nonBranchEdges.push(edge)
            }
        })

        return [branchEdges.sort((a, b) => (a.index ?? 0) - (b.index ?? 0)), nonBranchEdges]
    }, [nodeEdges, action.id])

    const addCohort = (): void => {
        const continueEdge = nodeEdges.find((edge) => edge.type === 'continue' && edge.from === action.id)
        if (!continueEdge) {
            throw new Error('Continue edge not found')
        }

        setCohorts([...cohorts, { percentage: 25 }])
        setWorkflowActionEdges(action.id, [
            ...branchEdges,
            {
                from: action.id,
                to: continueEdge.to,
                type: 'branch',
                index: cohorts.length,
            },
            ...nonBranchEdges,
        ])
    }

    const removeCohort = (index: number): void => {
        const newBranchEdges = branchEdges.filter((_, i) => i !== index).map((edge, i) => ({ ...edge, index: i }))
        setCohorts(cohorts.filter((_, i) => i !== index))
        setWorkflowActionEdges(action.id, [...newBranchEdges, ...nonBranchEdges])
    }

    const updateCohortPercentage = (index: number, percentage: number): void => {
        setCohorts(cohorts.map((cohort, i) => (i === index ? { ...cohort, percentage } : cohort)))
    }

    const normalizePercentages = (): void => {
        const count = cohorts.length
        if (count === 0) {
            return
        }
        const base = Math.floor(100 / count)
        const remainder = 100 - base * count
        const normalized = cohorts.map((cohort, i) => {
            // Distribute remainder to the first cohorts
            return { ...cohort, percentage: base + (i < remainder ? 1 : 0) }
        })
        setCohorts(normalized)
    }

    const totalPercentage = cohorts.reduce((sum, cohort) => sum + cohort.percentage, 0)

    return (
        <>
            <StepSchemaErrors />

            {cohorts.map((cohort, index) => (
                <div key={index} className="flex flex-col gap-2 p-2 rounded border">
                    <div className="flex justify-between items-center">
                        <Label>Cohort {index + 1}</Label>
                        <Button size="xsmall" icon={<IconX />} onClick={() => removeCohort(index)} />
                    </div>

                    <Input
                        value={localCohortNames[index] || ''}
                        onChange={(value) => handleNameChange(index, value)}
                        placeholder={`Cohort #${index + 1}`}
                        size="small"
                    />

                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={cohort.percentage}
                            onChange={(e) => updateCohortPercentage(index, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border rounded"
                        />
                        <span>%</span>
                    </div>
                </div>
            ))}

            {totalPercentage !== 100 && (
                <div className="text-sm text-orange-600">Total percentage: {totalPercentage}% (should equal 100%)</div>
            )}

            <div className="flex gap-2">
                <Button type="secondary" icon={<IconPlus />} onClick={() => addCohort()} className="flex-1">
                    Add cohort
                </Button>
                <Button type="secondary" onClick={normalizePercentages} tooltip="Normalize cohort percentages">
                    <IconBalance />
                </Button>
            </div>
        </>
    )
}

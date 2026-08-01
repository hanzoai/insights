import { BuiltLogic, useActions, useMountedLogic, useValues } from 'kea'

import { IconCheckCircle, IconPlus, IconRefresh } from '@hanzo/icons'
import { Banner, Button, Select } from '@hanzo/elements'

import { Link } from 'lib/elements/Link'
import { useAttachedLogic } from 'lib/logic/scenes/useAttachedLogic'
import { urls } from 'scenes/urls'

import { LLMTraceEvent } from '~/queries/schema/schema-general'

import { aiObservabilityTraceLogic } from '../aiObservabilityTraceLogic'
import { llmEvaluationsLogic } from '../evaluations/llmEvaluationsLogic'
import { generationEvaluationRunsLogic } from '../generationEvaluationRunsLogic'
import type { generationEvaluationRunsLogicType } from '../generationEvaluationRunsLogic'
import { llmEvaluationExecutionLogic } from '../llmEvaluationExecutionLogic'
import { formatLLMEventTitle } from '../utils'
import { GenerationEvalRunsTable } from './GenerationEvalRunsTable'

export function EvalsTabContent({
    traceId,
    generationEvent,
    distinctId,
}: {
    traceId: string
    generationEvent?: LLMTraceEvent
    distinctId?: string
}): JSX.Element {
    const runsLogic = generationEvaluationRunsLogic({ traceId })
    const traceLogic = useMountedLogic(aiObservabilityTraceLogic)

    useAttachedLogic(runsLogic, traceLogic)

    return (
        <EvalsTabContentInner
            generationEvent={generationEvent}
            distinctId={distinctId}
            generationRunsLogic={runsLogic}
        />
    )
}

function EvalsTabContentInner({
    generationEvent,
    distinctId,
    generationRunsLogic,
}: {
    generationEvent?: LLMTraceEvent
    distinctId?: string
    generationRunsLogic: BuiltLogic<generationEvaluationRunsLogicType>
}): JSX.Element {
    const { evaluations, evaluationsLoading } = useValues(llmEvaluationsLogic)
    const { runEvaluation } = useActions(llmEvaluationExecutionLogic)
    const { evaluationRunLoading } = useValues(llmEvaluationExecutionLogic)
    const { refreshGenerationEvaluationRuns, setSelectedEvaluationId } = useActions(generationRunsLogic)
    const { generationEvaluationRunsLoading, selectedEvaluationId } = useValues(generationRunsLogic)

    const availableEvaluations = evaluations?.filter((e) => !e.deleted) || []
    // Manual runs go through the generation workflow, so only generation-target evals
    // can be triggered from here, and only when there is a generation to point them at.
    const runnableEvaluations = generationEvent ? availableEvaluations.filter((e) => e.target === 'generation') : []
    const hasNoEvaluations = !evaluationsLoading && availableEvaluations.length === 0

    return (
        <div className="py-4">
            <Banner type="info" className="mb-4">
                Manually triggered evaluations typically appear within seconds, but may take a few minutes to process.
                Click Refresh to see new results.
            </Banner>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    {hasNoEvaluations ? (
                        <Link to={urls.aiObservabilityEvaluations()}>
                            <Button type="primary" icon={<IconPlus />} size="small">
                                Create your first evaluation
                            </Button>
                        </Link>
                    ) : generationEvent && !evaluationsLoading && runnableEvaluations.length === 0 ? (
                        <span className="text-muted text-sm">
                            No generation-target evaluations to run manually. Trace-target evaluations run
                            automatically.
                        </span>
                    ) : generationEvent ? (
                        <>
                            <Select
                                value={selectedEvaluationId}
                                onChange={setSelectedEvaluationId}
                                options={runnableEvaluations.map((evaluation) => ({
                                    value: evaluation.id,
                                    label: evaluation.name,
                                }))}
                                placeholder="Select an evaluation to run"
                                loading={evaluationsLoading}
                                className="w-80"
                            />
                            <Button
                                type="primary"
                                size="small"
                                icon={<IconCheckCircle />}
                                onClick={() => {
                                    if (selectedEvaluationId) {
                                        runEvaluation(
                                            selectedEvaluationId,
                                            generationEvent.id,
                                            generationEvent.createdAt,
                                            generationEvent.event,
                                            distinctId
                                        )
                                    }
                                }}
                                loading={evaluationRunLoading}
                                disabledReason={!selectedEvaluationId ? 'Select an evaluation first' : undefined}
                                data-attr="run-evaluation-manual"
                            >
                                Run Evaluation
                            </Button>
                            <span className="text-muted text-sm">
                                Runs on generation {formatLLMEventTitle(generationEvent)}
                            </span>
                        </>
                    ) : null}
                </div>
                <Button
                    type="secondary"
                    icon={<IconRefresh />}
                    onClick={refreshGenerationEvaluationRuns}
                    loading={generationEvaluationRunsLoading}
                    size="small"
                >
                    Refresh
                </Button>
            </div>
            <GenerationEvalRunsTable generationRunsLogic={generationRunsLogic} />
        </div>
    )
}

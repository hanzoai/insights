import { ScriptTransformerService } from '../../cdp/script-transformations/script-transformer.service'
import { Team } from '../../types'
import { BatchProcessingStep } from '../pipelines/base-batch-pipeline'
import { PipelineResult, ok } from '../pipelines/results'

export interface PrefetchInsightsFunctionsStepInput {
    team: Team
}

export function createPrefetchInsightsFunctionsStep<TInput extends PrefetchInsightsFunctionsStepInput>(
    scriptTransformer: ScriptTransformerService,
    sampleRate: number
): BatchProcessingStep<TInput, TInput> {
    return async function prefetchInsightsFunctionsStep(events: TInput[]): Promise<PipelineResult<TInput>[]> {
        // Skip prefetching if sampling determines we shouldn't run script watcher
        const shouldRunScriptWatcher = Math.random() < sampleRate
        if (!shouldRunScriptWatcher) {
            return events.map((event) => ok(event))
        }

        // Clear cached custom function states before fetching new ones
        scriptTransformer.clearInsightsFunctionStates()

        // Extract unique team IDs from the batch
        const teamIds = new Set<number>()
        for (const event of events) {
            teamIds.add(event.team.id)
        }

        if (teamIds.size === 0) {
            return events.map((event) => ok(event))
        }

        // Get custom function IDs for transformations
        const teamInsightsFunctionIds = await scriptTransformer['insightsFunctionManager'].getInsightsFunctionIdsForTeams(
            Array.from(teamIds),
            ['transformation']
        )

        // Flatten all custom function IDs into a single array
        const allInsightsFunctionIds = Object.values(teamInsightsFunctionIds).flat()

        if (allInsightsFunctionIds.length > 0) {
            // Cache the custom function states
            await scriptTransformer.fetchAndCacheInsightsFunctionStates(allInsightsFunctionIds)
        }

        // Return events unchanged
        return events.map((event) => ok(event))
    }
}

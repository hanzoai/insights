import { ScriptTransformerService } from '../../cdp/script-transformations/script-transformer.service'
import { Team } from '../../types'
import { BatchProcessingStep } from '../pipelines/base-batch-pipeline'
import { PipelineResult, ok } from '../pipelines/results'

export interface PrefetchCustomFunctionsStepInput {
    team: Team
}

export function createPrefetchCustomFunctionsStep<TInput extends PrefetchCustomFunctionsStepInput>(
    scriptTransformer: ScriptTransformerService,
    sampleRate: number
): BatchProcessingStep<TInput, TInput> {
    return async function prefetchCustomFunctionsStep(events: TInput[]): Promise<PipelineResult<TInput>[]> {
        // Skip prefetching if sampling determines we shouldn't run script watcher
        const shouldRunScriptWatcher = Math.random() < sampleRate
        if (!shouldRunScriptWatcher) {
            return events.map((event) => ok(event))
        }

        // Clear cached custom function states before fetching new ones
        scriptTransformer.clearCustomFunctionStates()

        // Extract unique team IDs from the batch
        const teamIds = new Set<number>()
        for (const event of events) {
            teamIds.add(event.team.id)
        }

        if (teamIds.size === 0) {
            return events.map((event) => ok(event))
        }

        // Get custom function IDs for transformations
        const teamCustomFunctionIds = await scriptTransformer['customFunctionManager'].getCustomFunctionIdsForTeams(
            Array.from(teamIds),
            ['transformation']
        )

        // Flatten all custom function IDs into a single array
        const allCustomFunctionIds = Object.values(teamCustomFunctionIds).flat()

        if (allCustomFunctionIds.length > 0) {
            // Cache the custom function states
            await scriptTransformer.fetchAndCacheCustomFunctionStates(allCustomFunctionIds)
        }

        // Return events unchanged
        return events.map((event) => ok(event))
    }
}

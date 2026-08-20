import { ScriptTransformer } from '~/common/script-transformations/script-transformer.interface'
import { PipelineWarning } from '~/ingestion/framework/pipeline.interface'
import { drop, ok } from '~/ingestion/framework/results'
import { ProcessingStep } from '~/ingestion/framework/steps'
import { PluginEvent } from '~/plugin-scaffold'
import { Team } from '~/types'

export interface ScriptTransformEventInput {
    event: PluginEvent
    team: Pick<Team, 'id'>
}

export interface ScriptTransformEventOutput {
    transformationsRun: number
}

/**
 * Creates a pipeline step that runs Script transformations on events.
 *
 * Script transformations are user-defined functions that can modify event properties,
 * change the event name, update distinct_id, or drop the event entirely.
 *
 * If a transformation drops the event (returns null), this step returns a `drop` result.
 */
export function createScriptTransformEventStep<T extends ScriptTransformEventInput>(
    scriptTransformer: Pick<ScriptTransformer, 'transformEventAndProduceMessages'> | null
): ProcessingStep<T, T & ScriptTransformEventOutput> {
    return async function scriptTransformEventStep(input) {
        const { event } = input

        // If no transformer configured, pass through unchanged
        if (!scriptTransformer) {
            return ok({ ...input, transformationsRun: 0 })
        }

        const result = await scriptTransformer.transformEventAndProduceMessages(event)

        // If transformation dropped the event, return drop result with a warning
        // so the user can see which transformation dropped it
        if (result.event === null) {
            const warning: PipelineWarning = {
                type: 'event_dropped_by_transformation',
                details: {
                    eventUuid: event.uuid,
                    event: event.event,
                    distinctId: event.distinct_id,
                    transformationId: result.droppedBy?.id,
                    transformationName: result.droppedBy?.name,
                },
                pipelineStep: 'script-transform',
                // Debounce per transformation so each dropping transformation surfaces
                key: result.droppedBy?.id,
            }
            return drop('dropped_by_transformation', [], [warning])
        }

        return ok({
            ...input,
            event: result.event,
            transformationsRun: result.invocationResults.length,
        })
    }
}

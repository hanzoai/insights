import { PluginEvent } from '@posthog/plugin-scaffold'

import { ScriptTransformerService, TransformationResult } from '../../../cdp/script-transformations/script-transformer.service'

export async function transformEventStep(
    event: PluginEvent,
    scriptTransformer: ScriptTransformerService | null
): Promise<TransformationResult> {
    if (!scriptTransformer) {
        return { event, invocationResults: [] }
    }
    return await scriptTransformer.transformEventAndProduceMessages(event)
}

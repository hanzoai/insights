import { CyclotronJobInputSchemaType, CyclotronJobInputType, InsightsFunctionTypeType } from '~/types'

export type InsightsFunctionDeliveryType = 'batch' | 'realtime'

// Batch exports vs realtime destinations share `type: 'destination'`; the only signal is the id prefix.
export function getInsightsFunctionDeliveryType(item: { id: string }): InsightsFunctionDeliveryType {
    return item.id.startsWith('batch-export-') ? 'batch' : 'realtime'
}

export function humanizeInsightsFunctionType(type: InsightsFunctionTypeType, plural: boolean = false): string {
    if (type === 'source_webhook') {
        return 'source' + (plural ? 's' : '')
    }
    if (type === 'site_app') {
        return 'Web script' + (plural ? 's' : '')
    }
    if (type === 'transformation_log') {
        return 'log transformation' + (plural ? 's' : '')
    }
    return type.replaceAll('_', ' ') + (plural ? 's' : '')
}

/** Default char cap for a config blob attached to the Insights AI agent as context. */
export const FN_FUNCTION_CONTEXT_MAX_CHARS = 10_000

/**
 * Caps a stringified config blob before it's registered as Insights AI attached context, so a pathological
 * script source or inputs payload can't bloat the agent's context window. These are keyed entity-style items
 * (not `type: 'text'`), so they're sent once per run rather than every turn; the cap is a safety ceiling.
 */
export function truncateInsightsFunctionContext(value: string, max: number = FN_FUNCTION_CONTEXT_MAX_CHARS): string {
    return value.length > max ? value.slice(0, max) + '… (truncated)' : value
}

/**
 * Replaces secret input values with a placeholder before the live form config leaves the scene (agent
 * context, approval-card diffs). A saved secret comes back masked from the API, but a value the user
 * just typed sits in form state in cleartext and must never reach the LLM. An entry counts as secret
 * when the schema marks its key secret or the entry itself carries `secret: true`.
 */
export function redactSecretInsightsFunctionInputs(
    inputs: Record<string, CyclotronJobInputType>,
    inputsSchema: CyclotronJobInputSchemaType[]
): Record<string, CyclotronJobInputType> {
    const secretKeys = new Set(inputsSchema.filter((schema) => schema.secret).map((schema) => schema.key))
    return Object.fromEntries(
        Object.entries(inputs).map(([key, entry]) => {
            const isSecret = secretKeys.has(key) || entry?.secret === true
            return [key, isSecret && entry ? { ...entry, value: '[secret]' } : entry]
        })
    )
}

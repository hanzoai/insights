import { createHash } from 'crypto'

import { RedisV2 } from '~/common/redis/redis-v2'

import {
    CyclotronJobInvocation,
    CyclotronJobInvocationCustomFlow,
    CyclotronJobInvocationCustomFunction,
    CustomFunctionMasking,
} from '../../types'
import { execScript } from '../../utils/script-exec'

export const BASE_REDIS_KEY = process.env.NODE_ENV == 'test' ? '@insights-test/script-masker' : '@posthog/script-masker'
const REDIS_KEY_TOKENS = `${BASE_REDIS_KEY}/mask`

// NOTE: These are controlled via the api so are more of a sanity fallback
const MASKER_MAX_TTL_CUSTOM_FUNCTION = 60 * 60 * 24
const MASKER_MAX_TTL_CUSTOM_FLOW = 60 * 60 * 24 * 365 * 3 // 3 years
const MASKER_MIN_TTL = 1

type MaskContext = {
    customFunctionId: string
    hash: string
    increment: number
    ttl: number
    allowedExecutions: number
    threshold: number | null
}

type GenericScriptInvocationWithMasker = CyclotronJobInvocation & {
    masker?: MaskContext
}

function isCustomFunctionInvocation(invocation: CyclotronJobInvocation): invocation is CyclotronJobInvocationCustomFunction {
    return (invocation as CyclotronJobInvocationCustomFunction).customFunction !== undefined
}

function isCustomFlowInvocation(invocation: CyclotronJobInvocation): invocation is CyclotronJobInvocationCustomFlow {
    return (invocation as CyclotronJobInvocationCustomFlow).customFlow !== undefined
}

// Helper to extract masking config from different types
function extractMaskingConfig(invocation: CyclotronJobInvocation): CustomFunctionMasking | null {
    if (isCustomFunctionInvocation(invocation)) {
        return invocation.customFunction.masking || null
    }

    if (isCustomFlowInvocation(invocation)) {
        return invocation.customFlow.trigger_masking || null
    }

    throw new Error('Unable to extract masking config from unknown invocation type')
}

function extractGlobals(invocation: CyclotronJobInvocation): Record<string, any> {
    if (isCustomFunctionInvocation(invocation)) {
        return invocation.state.globals
    }
    if (isCustomFlowInvocation(invocation)) {
        // For custom flows, we need to construct globals from the filter globals and event
        return {
            event: invocation.state?.event,
            person: invocation.person,
        }
    }

    throw new Error('Unable to extract globals from unknown invocation type')
}

// Helper to get entity ID for masking
function getEntityId(invocation: CyclotronJobInvocation): string {
    if (isCustomFunctionInvocation(invocation)) {
        return invocation.customFunction.id
    }
    if (isCustomFlowInvocation(invocation)) {
        return invocation.customFlow.id
    }
    return invocation.functionId
}

function getTtl(invocation: CyclotronJobInvocation, maskingConfig: CustomFunctionMasking): number {
    const maxTtl = isCustomFlowInvocation(invocation) ? MASKER_MAX_TTL_CUSTOM_FLOW : MASKER_MAX_TTL_CUSTOM_FUNCTION
    return Math.max(MASKER_MIN_TTL, Math.min(maxTtl, maskingConfig.ttl ?? maxTtl))
}

/**
 * ScriptMaskerService
 *
 * Responsible for determining if a function is "masked" or not based on the function configuration
 */

// Script masker is meant to be done per batch
export class ScriptMaskerService {
    constructor(private redis: RedisV2) {}

    public async filterByMasking<T extends CyclotronJobInvocation>(
        invocations: T[]
    ): Promise<{
        masked: T[]
        notMasked: T[]
    }> {
        const invocationsWithMasker: GenericScriptInvocationWithMasker[] = [...invocations]
        const masks: Record<string, MaskContext> = {}

        // We find all functions/flows that have a mask and we load their masking from redis
        for (const item of invocationsWithMasker) {
            const maskingConfig = extractMaskingConfig(item)
            if (maskingConfig) {
                const globals = extractGlobals(item)

                // TODO: Catch errors
                const execScriptResult = await execScript(maskingConfig.bytecode, {
                    globals,
                    timeout: 50,
                })

                if (!execScriptResult.execResult?.result) {
                    continue
                }
                // What to do if it is null....

                const hash = createHash('md5')
                    .update(String(execScriptResult.execResult.result))
                    .digest('hex')
                    .substring(0, 32)
                const entityId = getEntityId(item)
                const hashKey = `${entityId}:${hash}`
                masks[hashKey] = masks[hashKey] || {
                    hash,
                    customFunctionId: entityId,
                    increment: 0,
                    ttl: getTtl(item, maskingConfig),
                    threshold: maskingConfig.threshold,
                    allowedExecutions: 0,
                }
                masks[hashKey]!.increment++
                item.masker = masks[hashKey]
            }
        }

        if (Object.keys(masks).length === 0) {
            return { masked: [], notMasked: invocations }
        }

        const result = await this.redis.usePipeline({ name: 'masker', failOpen: true }, (pipeline) => {
            Object.values(masks).forEach(({ customFunctionId, hash, increment, ttl }) => {
                pipeline.incrby(`${REDIS_KEY_TOKENS}/${customFunctionId}/${hash}`, increment)
                // @ts-expect-error - NX is not typed in ioredis
                pipeline.expire(`${REDIS_KEY_TOKENS}/${customFunctionId}/${hash}`, ttl, 'NX')
            })
        })

        Object.values(masks).forEach((masker, index) => {
            const newValue: number | null = result ? result[index * 2][1] : null
            if (newValue === null) {
                // We fail closed here as with a masking config the typical case will be not to send
                return
            }

            const oldValue = newValue - masker.increment

            // Simplest case - the previous value was 0
            masker.allowedExecutions = oldValue === 0 ? 1 : 0

            if (masker.threshold) {
                // TRICKY: We minus 1 to account for the "first" execution
                const thresholdsPasses =
                    Math.floor((newValue - 1) / masker.threshold) - Math.floor((oldValue - 1) / masker.threshold)

                if (thresholdsPasses) {
                    masker.allowedExecutions = thresholdsPasses
                }
            }
        })

        return invocationsWithMasker.reduce(
            (acc, item) => {
                if (item.masker) {
                    if (item.masker.allowedExecutions > 0) {
                        item.masker.allowedExecutions--
                        acc.notMasked.push(item as T)
                    } else {
                        acc.masked.push(item as T)
                    }
                } else {
                    acc.notMasked.push(item as T)
                }
                return acc
            },
            { masked: [], notMasked: [] } as {
                masked: T[]
                notMasked: T[]
            }
        )
    }
}

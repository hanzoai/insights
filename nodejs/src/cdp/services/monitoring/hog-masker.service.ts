import { createHash } from 'crypto'

import { RedisClientPipeline, RedisV2 } from '~/common/redis/redis-v2'

import {
    CyclotronJobInvocation,
    CyclotronJobInvocationInsightsFlow,
    CyclotronJobInvocationInsightsFunction,
    InsightsFunctionMasking,
} from '../../types'
import { execHog } from '../../utils/script-exec'
import { mirrorCall } from '../../utils/mirror-call'

export const BASE_REDIS_KEY = process.env.NODE_ENV == 'test' ? '@insights-test/script-masker' : '@hanzo/script-masker'
const REDIS_KEY_TOKENS = `${BASE_REDIS_KEY}/mask`

// NOTE: These are controlled via the api so are more of a sanity fallback
const MASKER_MAX_TTL_FN_FUNCTION = 60 * 60 * 24
const MASKER_MAX_TTL_FN_FLOW = 60 * 60 * 24 * 365 * 3 // 3 years
const MASKER_MIN_TTL = 1

type MaskContext = {
    insightsFunctionId: string
    hash: string
    increment: number
    ttl: number
    allowedExecutions: number
    threshold: number | null
}

type GenericHogInvocationWithMasker = CyclotronJobInvocation & {
    masker?: MaskContext
}

function isInsightsFunctionInvocation(invocation: CyclotronJobInvocation): invocation is CyclotronJobInvocationInsightsFunction {
    return (invocation as CyclotronJobInvocationInsightsFunction).insightsFunction !== undefined
}

function isInsightsFlowInvocation(invocation: CyclotronJobInvocation): invocation is CyclotronJobInvocationInsightsFlow {
    return (invocation as CyclotronJobInvocationInsightsFlow).hogFlow !== undefined
}

// Helper to extract masking config from different types
function extractMaskingConfig(invocation: CyclotronJobInvocation): InsightsFunctionMasking | null {
    if (isInsightsFunctionInvocation(invocation)) {
        return invocation.insightsFunction.masking || null
    }

    if (isInsightsFlowInvocation(invocation)) {
        return invocation.hogFlow.trigger_masking || null
    }

    throw new Error('Unable to extract masking config from unknown invocation type')
}

function extractGlobals(invocation: CyclotronJobInvocation): Record<string, any> {
    if (isInsightsFunctionInvocation(invocation)) {
        return invocation.state.globals
    }
    if (isInsightsFlowInvocation(invocation)) {
        // For script flows, we need to construct globals from the filter globals and event
        return {
            event: invocation.state?.event,
            person: invocation.person,
        }
    }

    throw new Error('Unable to extract globals from unknown invocation type')
}

// Helper to get entity ID for masking
function getEntityId(invocation: CyclotronJobInvocation): string {
    if (isInsightsFunctionInvocation(invocation)) {
        return invocation.insightsFunction.id
    }
    if (isInsightsFlowInvocation(invocation)) {
        return invocation.hogFlow.id
    }
    return invocation.functionId
}

function getTtl(invocation: CyclotronJobInvocation, maskingConfig: InsightsFunctionMasking): number {
    const maxTtl = isInsightsFlowInvocation(invocation) ? MASKER_MAX_TTL_FN_FLOW : MASKER_MAX_TTL_FN_FUNCTION
    return Math.max(MASKER_MIN_TTL, Math.min(maxTtl, maskingConfig.ttl ?? maxTtl))
}

/**
 * HogMaskerService
 *
 * Responsible for determining if a function is "masked" or not based on the function configuration
 */

// Script masker is meant to be done per batch
export class HogMaskerService {
    constructor(
        private redis: RedisV2,
        private redisMirror: RedisV2 | null = null
    ) {}

    public async filterByMasking<T extends CyclotronJobInvocation>(
        invocations: T[]
    ): Promise<{
        masked: T[]
        notMasked: T[]
    }> {
        const invocationsWithMasker: GenericHogInvocationWithMasker[] = [...invocations]
        const masks: Record<string, MaskContext> = {}

        // We find all functions/flows that have a mask and we load their masking from redis
        for (const item of invocationsWithMasker) {
            const maskingConfig = extractMaskingConfig(item)
            if (maskingConfig) {
                const globals = extractGlobals(item)

                // TODO: Catch errors
                const execHogResult = await execHog(maskingConfig.bytecode, {
                    globals,
                    timeout: 50,
                })

                if (!execHogResult.execResult?.result) {
                    continue
                }
                // What to do if it is null....

                const hash = createHash('md5')
                    .update(String(execHogResult.execResult.result))
                    .digest('hex')
                    .substring(0, 32)
                const entityId = getEntityId(item)
                const hashKey = `${entityId}:${hash}`
                masks[hashKey] = masks[hashKey] || {
                    hash,
                    insightsFunctionId: entityId,
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

        const buildPipeline = (pipeline: RedisClientPipeline): void => {
            Object.values(masks).forEach(({ insightsFunctionId, hash, increment, ttl }) => {
                pipeline.incrby(`${REDIS_KEY_TOKENS}/${insightsFunctionId}/${hash}`, increment)
                // @ts-expect-error - NX is not typed in ioredis
                pipeline.expire(`${REDIS_KEY_TOKENS}/${insightsFunctionId}/${hash}`, ttl, 'NX')
            })
        }

        const [result] = await Promise.all([
            this.redis.usePipeline({ name: 'masker', failOpen: true }, buildPipeline),
            mirrorCall('script-masker.filterByMasking', () =>
                this.redisMirror?.usePipeline({ name: 'masker-mirror', failOpen: true }, buildPipeline)
            ),
        ])

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

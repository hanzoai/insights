import { Counter } from 'prom-client'

import { RedisV2, getRedisPipelineResults } from '~/common/redis/redis-v2'
import { LazyLoader } from '~/utils/lazy-loader'
import { logger } from '~/utils/logger'
import { captureTeamEvent } from '~/utils/insights'

import { Hub } from '../../../types'
import {
    CyclotronJobInvocation,
    CyclotronJobInvocationCustomFunction,
    CyclotronJobInvocationResult,
    CustomFunctionTiming,
    CustomFunctionType,
} from '../../types'

export type ScriptWatcherServiceHub = Pick<
    Hub,
    | 'teamManager'
    | 'CDP_WATCHER_HOG_COST_TIMING_LOWER_MS'
    | 'CDP_WATCHER_HOG_COST_TIMING_UPPER_MS'
    | 'CDP_WATCHER_HOG_COST_TIMING'
    | 'CDP_WATCHER_ASYNC_COST_TIMING_LOWER_MS'
    | 'CDP_WATCHER_ASYNC_COST_TIMING_UPPER_MS'
    | 'CDP_WATCHER_ASYNC_COST_TIMING'
    | 'CDP_WATCHER_SEND_EVENTS'
    | 'CDP_WATCHER_BUCKET_SIZE'
    | 'CDP_WATCHER_REFILL_RATE'
    | 'CDP_WATCHER_TTL'
    | 'CDP_WATCHER_AUTOMATICALLY_DISABLE_FUNCTIONS'
    | 'CDP_WATCHER_THRESHOLD_DEGRADED'
    | 'CDP_WATCHER_STATE_LOCK_TTL'
    | 'CDP_WATCHER_OBSERVE_RESULTS_BUFFER_TIME_MS'
    | 'CDP_WATCHER_OBSERVE_RESULTS_BUFFER_MAX_RESULTS'
>

export const BASE_REDIS_KEY = process.env.NODE_ENV == 'test' ? '@insights-test/script-watcher-2' : '@posthog/script-watcher-2'
const REDIS_KEY_TOKENS = `${BASE_REDIS_KEY}/tokens`
const REDIS_KEY_STATE = `${BASE_REDIS_KEY}/state`
const REDIS_KEY_STATE_LOCK = `${BASE_REDIS_KEY}/state-lock`

export enum ScriptWatcherState {
    healthy = 1,
    degraded = 2,
    disabled = 3,

    // These are states that we do not auto transition into - can only be modified by the admin tool
    forcefully_degraded = 11,
    forcefully_disabled = 12,
}

export type ScriptWatcherFunctionState = {
    tokens: number
    state: ScriptWatcherState
}

const customFunctionStateChange = new Counter({
    name: 'cdp_custom_function_state_change',
    help: 'Number of times a transformation state changed',
    labelNames: ['state', 'kind'],
})

type CustomFunctionTimingCost = {
    lowerBound: number
    upperBound: number
    cost: number
}

type CustomFunctionTimingCosts = Partial<Record<CustomFunctionTiming['kind'], CustomFunctionTimingCost>>

// Check if the result is of type CyclotronJobInvocationCustomFunction
export const isCustomFunctionResult = (
    result: CyclotronJobInvocationResult
): result is CyclotronJobInvocationResult<CyclotronJobInvocationCustomFunction> => {
    return 'customFunction' in result.invocation
}

// Helper if you don't care about the forced side of things
export const effectiveState = (state: ScriptWatcherState) => {
    if (state === ScriptWatcherState.forcefully_degraded) {
        return ScriptWatcherState.degraded
    }
    if (state === ScriptWatcherState.forcefully_disabled) {
        return ScriptWatcherState.disabled
    }
    return state
}

export class ScriptWatcherService {
    private costsMapping: CustomFunctionTimingCosts
    private lazyLoader: LazyLoader<ScriptWatcherFunctionState>

    private queuedResults: {
        results: CyclotronJobInvocationResult[]
        promise: Promise<void>
        timeout: NodeJS.Timeout
        complete: () => void
    } | null = null

    constructor(
        private hub: ScriptWatcherServiceHub,
        private redis: RedisV2
    ) {
        this.costsMapping = {
            script: {
                lowerBound: this.hub.CDP_WATCHER_HOG_COST_TIMING_LOWER_MS,
                upperBound: this.hub.CDP_WATCHER_HOG_COST_TIMING_UPPER_MS,
                cost: this.hub.CDP_WATCHER_HOG_COST_TIMING,
            },
            async_function: {
                lowerBound: this.hub.CDP_WATCHER_ASYNC_COST_TIMING_LOWER_MS,
                upperBound: this.hub.CDP_WATCHER_ASYNC_COST_TIMING_UPPER_MS,
                cost: this.hub.CDP_WATCHER_ASYNC_COST_TIMING,
            },
        }

        for (const [kind, mapping] of Object.entries(this.costsMapping)) {
            if (mapping.lowerBound >= mapping.upperBound) {
                throw new Error(
                    `Lower bound for kind ${kind} of ${mapping.lowerBound}ms must be lower than upper bound of ${mapping.upperBound}ms. This is a configuration error.`
                )
            }
        }

        this.lazyLoader = new LazyLoader({
            name: 'hog_watcher_lazy_loader',
            refreshAgeMs: 30_000, // Cache for 30 seconds
            refreshJitterMs: 10_000,
            loader: async (ids) => await this.getPersistedStates(ids),
        })
    }

    private async onStateChange({
        customFunction,
        state,
        previousState,
    }: {
        customFunction: CustomFunctionType
        state: ScriptWatcherState
        previousState: ScriptWatcherState
    }) {
        const team = await this.hub.teamManager.getTeam(customFunction.team_id)

        logger.info('[ScriptWatcherService] onStateChange', {
            customFunctionId: customFunction.id,
            customFunctionName: customFunction.name,
            state,
            previousState,
        })

        if (team && this.hub.CDP_WATCHER_SEND_EVENTS) {
            captureTeamEvent(team, 'custom_function_state_change', {
                custom_function_id: customFunction.id,
                custom_function_type: customFunction.type,
                custom_function_name: customFunction.name,
                custom_function_template_id: customFunction.template_id,
                state: ScriptWatcherState[state], // Convert numeric state to readable string
                previous_state: ScriptWatcherState[previousState], // Convert numeric state to readable string
            })
        }
    }

    private rateLimitArgs(id: CustomFunctionType['id'], cost: number) {
        const nowSeconds = Math.round(Date.now() / 1000)

        return [
            `${REDIS_KEY_TOKENS}/${id}`,
            nowSeconds,
            cost,
            this.hub.CDP_WATCHER_BUCKET_SIZE,
            this.hub.CDP_WATCHER_REFILL_RATE,
            this.hub.CDP_WATCHER_TTL,
        ] as const
    }

    public calculateNewState(tokens: number): ScriptWatcherState {
        const rating = tokens / this.hub.CDP_WATCHER_BUCKET_SIZE

        if (rating < 0 && this.hub.CDP_WATCHER_AUTOMATICALLY_DISABLE_FUNCTIONS) {
            return ScriptWatcherState.disabled
        }
        if (rating <= this.hub.CDP_WATCHER_THRESHOLD_DEGRADED) {
            return ScriptWatcherState.degraded
        }

        return ScriptWatcherState.healthy
    }

    /**
     * Get the persisted states of a list of custom functions
     */
    public async getPersistedStates(
        ids: CustomFunctionType['id'][]
    ): Promise<Record<CustomFunctionType['id'], ScriptWatcherFunctionState>> {
        const idsSet = new Set(ids)

        const res = await this.redis.usePipeline({ name: 'getStates' }, (pipeline) => {
            for (const id of idsSet) {
                pipeline.checkRateLimitV2(...this.rateLimitArgs(id, 0))
                pipeline.get(`${REDIS_KEY_STATE}/${id}`)
            }
        })

        return Array.from(idsSet).reduce(
            (acc, id, index) => {
                const resIndex = index * 2
                // V2 returns [tokensBefore, tokensAfter], we use tokensAfter
                const tokenResult = res ? res[resIndex][1] : undefined
                const tokens = tokenResult?.[1] ?? this.hub.CDP_WATCHER_BUCKET_SIZE
                const state = res ? res[resIndex + 1][1] : undefined

                acc[id] = {
                    state: state ? Number(state) : ScriptWatcherState.healthy,
                    tokens: tokens,
                }

                return acc
            },
            {} as Record<CustomFunctionType['id'], ScriptWatcherFunctionState>
        )
    }

    /**
     * Like getPersistedStates but returns the state of a single custom function
     */
    public async getPersistedState(id: CustomFunctionType['id']): Promise<ScriptWatcherFunctionState> {
        const res = await this.getPersistedStates([id])
        return res[id]
    }

    public async getCachedPersistedState(id: CustomFunctionType['id']): Promise<ScriptWatcherFunctionState | null> {
        return await this.lazyLoader.get(id)
    }

    /**
     * Like getPersistedStates but returns the effective state (i.e. ignores forcefully set states)
     */
    public async getEffectiveStates(
        ids: CustomFunctionType['id'][]
    ): Promise<Record<CustomFunctionType['id'], ScriptWatcherFunctionState>> {
        const states = await this.getPersistedStates(ids)
        return Object.fromEntries(
            Object.entries(states).map(([id, state]) => [
                id,
                { state: effectiveState(state.state), tokens: state.tokens },
            ])
        )
    }

    /**
     * Like getPersistedState but returns the effective state (i.e. ignores forcefully set states)
     */
    public async getEffectiveState(id: CustomFunctionType['id']): Promise<ScriptWatcherFunctionState> {
        const res = await this.getEffectiveStates([id])
        return res[id]
    }

    public async getCachedEffectiveState(id: CustomFunctionType['id']): Promise<ScriptWatcherFunctionState | null> {
        const res = await this.lazyLoader.get(id)
        if (!res) {
            return null
        }

        return { state: effectiveState(res.state), tokens: res.tokens }
    }

    public async getAllFunctionStates(): Promise<Record<CustomFunctionType['id'], ScriptWatcherFunctionState>> {
        // Scan all state keys in Redis
        const stateKeys = await this.redis.useClient({ name: 'scanStates' }, async (client) => {
            const keys: string[] = []
            let cursor = '0'

            do {
                const [newCursor, batch] = await client.scan(cursor, 'MATCH', `${REDIS_KEY_STATE}/*`, 'COUNT', 500)
                cursor = newCursor
                keys.push(...batch)
            } while (cursor !== '0')

            return keys
        })

        if (!stateKeys || stateKeys.length === 0) {
            return {}
        }

        // Extract function IDs from the keys
        const functionIds = stateKeys.map((key: string) => key.replace(`${REDIS_KEY_STATE}/`, ''))

        // Get states for all found function IDs
        return await this.getPersistedStates(functionIds)
    }

    public async clearLock(id: CustomFunctionType['id']): Promise<void> {
        await this.redis.usePipeline({ name: 'clearLock' }, (pipeline) => {
            pipeline.del(`${REDIS_KEY_STATE_LOCK}/${id}`)
        })
    }

    public async doStageChanges(
        changes: [CustomFunctionType, ScriptWatcherState][],
        forceReset: boolean = false
    ): Promise<void> {
        logger.info('[ScriptWatcherService] Performing state changes', { changes, forceReset })

        const res = await this.redis.usePipeline({ name: 'forceStateChange' }, (pipeline) => {
            for (const [customFunction, state] of changes) {
                customFunctionStateChange.inc({
                    state: ScriptWatcherState[state],
                    kind: customFunction.type,
                })

                const id = customFunction.id
                const newScore =
                    state === ScriptWatcherState.healthy
                        ? this.hub.CDP_WATCHER_BUCKET_SIZE
                        : state === ScriptWatcherState.degraded
                          ? this.hub.CDP_WATCHER_BUCKET_SIZE * this.hub.CDP_WATCHER_THRESHOLD_DEGRADED
                          : 0

                const nowSeconds = Math.round(Date.now() / 1000)

                pipeline.getset(`${REDIS_KEY_STATE}/${id}`, state) // Set the state
                pipeline.setex(`${REDIS_KEY_STATE_LOCK}/${id}`, this.hub.CDP_WATCHER_STATE_LOCK_TTL, '1') // Set the lock
                if (forceReset) {
                    pipeline.hset(`${REDIS_KEY_TOKENS}/${id}`, 'pool', newScore)
                    pipeline.hset(`${REDIS_KEY_TOKENS}/${id}`, 'ts', nowSeconds)
                }
            }
        })

        if (!res) {
            return
        }

        const numOperations = forceReset ? 4 : 2

        await Promise.all(
            changes.map(async ([customFunction, state], index) => {
                const [stateResult] = getRedisPipelineResults(res, index, numOperations)
                const previousState = Number(stateResult[1] ?? ScriptWatcherState.healthy)
                if (previousState !== state) {
                    await this.onStateChange({
                        customFunction,
                        state,
                        previousState,
                    })
                }
            })
        )
    }

    public async forceStateChange(customFunction: CustomFunctionType, state: ScriptWatcherState): Promise<void> {
        await this.doStageChanges([[customFunction, state]])
    }

    public async observeResults(results: CyclotronJobInvocationResult[]): Promise<void> {
        const functionCosts: Record<
            CyclotronJobInvocation['functionId'],
            {
                customFunction?: CustomFunctionType
                functionId: CyclotronJobInvocation['functionId']
                cost: number
            }
        > = {}

        results.forEach((result) => {
            if (!isCustomFunctionResult(result)) {
                return
            }

            const functionCost = functionCosts[result.invocation.functionId] ?? {
                functionId: result.invocation.functionId,
                cost: 0,
                customFunction: result.invocation.customFunction,
            }

            if (result.finished) {
                // Process each timing entry individually instead of totaling them
                for (const timing of result.invocation.state.timings) {
                    const costConfig = this.costsMapping[timing.kind]
                    if (costConfig) {
                        const ratio =
                            Math.max(timing.duration_ms - costConfig.lowerBound, 0) /
                            (costConfig.upperBound - costConfig.lowerBound)
                        functionCost.cost += Math.round(costConfig.cost * ratio)
                    }
                }
            }

            functionCosts[result.invocation.functionId] = functionCost
        })

        // We apply the costs and return the existing states so we can calculate those that need a state change
        const res = await this.redis.usePipeline({ name: 'updateRateLimits' }, (pipeline) => {
            for (const functionCost of Object.values(functionCosts)) {
                pipeline.get(`${REDIS_KEY_STATE}/${functionCost.functionId}`)
                pipeline.get(`${REDIS_KEY_STATE_LOCK}/${functionCost.functionId}`)
                pipeline.checkRateLimitV2(...this.rateLimitArgs(functionCost.functionId, functionCost.cost))
            }
        })

        if (!res) {
            return
        }

        const changes: [CustomFunctionType, ScriptWatcherState][] = []

        // Calculate all those that have changed state
        Object.values(functionCosts).map((functionCost, index) => {
            const [stateResult, lockResult, tokenResult] = getRedisPipelineResults(res, index, 3)

            const currentState: ScriptWatcherState = Number(stateResult[1] ?? ScriptWatcherState.healthy)
            // V2 returns [tokensBefore, tokensAfter], we use tokensAfter
            const tokens = Number(tokenResult[1]?.[1] ?? this.hub.CDP_WATCHER_BUCKET_SIZE)
            const newState = this.calculateNewState(tokens)

            if (currentState !== newState) {
                if (lockResult[1]) {
                    // We don't want to change the state of a function that is being locked (i.e. recently changed state)
                    return
                }

                if (currentState === ScriptWatcherState.disabled || currentState >= ScriptWatcherState.forcefully_degraded) {
                    // We never modify the state of a disabled function automatically, or a forcefully set value
                    return
                }

                if (functionCost.customFunction) {
                    changes.push([functionCost.customFunction, newState])
                }
            }
        })

        if (changes.length > 0) {
            await this.doStageChanges(changes)
        }
    }

    public async observeResultsBuffered(result: CyclotronJobInvocationResult): Promise<void> {
        // This can be called a bunch of times and will queue up results to be processed
        // We need to make sure that we only process the results once
        if (!this.queuedResults) {
            let resolvePromise: () => void
            const promise = new Promise<void>((resolve) => {
                resolvePromise = resolve
            })

            this.queuedResults = {
                results: [],
                promise,
                complete: resolvePromise!,
                timeout: setTimeout(
                    () => this.flushBufferedResults(),
                    this.hub.CDP_WATCHER_OBSERVE_RESULTS_BUFFER_TIME_MS
                ),
            }
        }

        this.queuedResults.results.push(result)

        if (this.queuedResults.results.length >= this.hub.CDP_WATCHER_OBSERVE_RESULTS_BUFFER_MAX_RESULTS) {
            await this.flushBufferedResults()
        } else {
            await this.queuedResults.promise
        }
    }

    private async flushBufferedResults() {
        if (!this.queuedResults) {
            return
        }

        const { results, timeout, complete } = this.queuedResults
        clearTimeout(timeout)
        this.queuedResults = null
        await this.observeResults(results)
        complete()
    }
}

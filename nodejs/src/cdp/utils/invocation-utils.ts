// NOTE: PostIngestionEvent is our context event - it should never be sent directly to an output, but rather transformed into a lightweight schema
import { DateTime } from 'luxon'

import { UUIDT } from '~/common/utils/utils'

import type { ScriptInputsService } from '../services/script-inputs.service'
import {
    CyclotronJobInvocation,
    CyclotronJobInvocationInsightsFunction,
    CyclotronJobInvocationResult,
    InsightsFunctionFilterGlobals,
    InsightsFunctionInvocationGlobals,
    InsightsFunctionInvocationGlobalsWithInputs,
    LogEntry,
    MinimalAppMetric,
} from '../types'
import { InsightsFunctionType } from '../types'
import { convertToInsightsFunctionFilterGlobal, filterFunctionInstrumented } from './script-function-filtering'

export function createInvocation(
    globals: InsightsFunctionInvocationGlobalsWithInputs,
    insightsFunction: InsightsFunctionType
): CyclotronJobInvocationInsightsFunction {
    return {
        id: new UUIDT().toString(),
        state: {
            globals,
            timings: [],
            attempts: 0,
        },
        teamId: insightsFunction.team_id,
        functionId: insightsFunction.id,
        insightsFunction,
        queue: 'script',
        queuePriority: 0,
    }
}

/**
 * Matches a batch of script functions against one event's globals and builds an invocation per match,
 * resolving each one's inputs. Filter metrics/logs come back alongside for the caller to queue.
 */
export async function buildInsightsFunctionInvocations(
    scriptInputsService: ScriptInputsService,
    insightsFunctions: InsightsFunctionType[],
    triggerGlobals: InsightsFunctionInvocationGlobals
): Promise<{
    invocations: CyclotronJobInvocationInsightsFunction[]
    metrics: MinimalAppMetric[]
    logs: LogEntry[]
}> {
    const metrics: MinimalAppMetric[] = []
    const logs: LogEntry[] = []
    const invocations: CyclotronJobInvocationInsightsFunction[] = []

    // TRICKY: The frontend generates filters matching the Datastore event type so we are converting back
    const filterGlobals = convertToInsightsFunctionFilterGlobal(triggerGlobals)

    const _filterInsightsFunction = async (
        insightsFunction: InsightsFunctionType,
        filters: InsightsFunctionType['filters'],
        filterGlobals: InsightsFunctionFilterGlobals
    ): Promise<boolean> => {
        const filterResults = await filterFunctionInstrumented({
            fn: insightsFunction,
            filters,
            filterGlobals,
        })

        // Add any generated metrics and logs to our collections
        metrics.push(...filterResults.metrics)
        logs.push(...filterResults.logs)

        return filterResults.match
    }

    const _buildInvocation = async (
        insightsFunction: InsightsFunctionType,
        additionalInputs?: InsightsFunctionType['inputs']
    ): Promise<CyclotronJobInvocationInsightsFunction | null> => {
        try {
            const globalsWithSource = {
                ...triggerGlobals,
                source: {
                    name: insightsFunction.name ?? `Script function: ${insightsFunction.id}`,
                    url: `${triggerGlobals.project.url}/functions/${insightsFunction.id}/configuration/`,
                },
            }

            const globalsWithInputs = await scriptInputsService.buildInputsWithGlobals(
                insightsFunction,
                globalsWithSource,
                additionalInputs
            )

            return createInvocation(globalsWithInputs, insightsFunction)
        } catch (error) {
            logs.push({
                team_id: insightsFunction.team_id,
                log_source: 'insights_function',
                log_source_id: insightsFunction.id,
                instance_id: new UUIDT().toString(), // random UUID, like it would be for an invocation
                timestamp: DateTime.now(),
                level: 'error',
                message: `Error building inputs for event ${triggerGlobals.event.uuid}: ${error.message}`,
            })

            metrics.push({
                team_id: insightsFunction.team_id,
                app_source_id: insightsFunction.id,
                metric_kind: 'failure',
                metric_name: 'inputs_failed',
                count: 1,
            })

            return null
        }
    }

    await Promise.all(
        insightsFunctions.map(async (insightsFunction) => {
            // We always check the top level filters
            if (!(await _filterInsightsFunction(insightsFunction, insightsFunction.filters, filterGlobals))) {
                return
            }

            // Check for non-mapping functions first
            if (!insightsFunction.mappings) {
                const invocation = await _buildInvocation(insightsFunction)
                if (!invocation) {
                    return
                }

                invocations.push(invocation)
                return
            }

            await Promise.all(
                insightsFunction.mappings.map(async (mapping) => {
                    if (!(await _filterInsightsFunction(insightsFunction, mapping.filters, filterGlobals))) {
                        return
                    }

                    const invocation = await _buildInvocation(insightsFunction, mapping.inputs ?? {})
                    if (!invocation) {
                        return
                    }

                    invocations.push(invocation)
                })
            )
        })
    )

    return {
        invocations,
        metrics,
        logs,
    }
}

/**
 * Clones an invocation, removing all queue related values
 */

export function cloneInvocation<T extends CyclotronJobInvocation>(
    invocation: T,
    params: Pick<
        Partial<CyclotronJobInvocation>,
        'queue' | 'queuePriority' | 'queueMetadata' | 'queueScheduledAt' | 'queueParameters'
    > = {}
): T {
    return {
        ...invocation,
        // The target queue is typically the same as the source but can be overridden
        queue: params.queue ?? invocation.queue,
        // The source is kept from the invocation always as it is important for the job queue router
        queueSource: invocation.queueSource,
        // Metadata is only used from the invocation if the queue is staying the same
        queueMetadata:
            params.queueMetadata ?? (invocation.queue === params.queue ? invocation.queueMetadata : undefined),

        // Below params are always reset unless provided as overrides
        queueScheduledAt: params.queueScheduledAt ?? undefined,
        queuePriority: params.queuePriority ?? 0,
        queueParameters: params.queueParameters ?? undefined,
    }
}

/**
 * Safely creates an invocation result from an invocation, cloning it and resetting the relevant queue parameters
 */
export function createInvocationResult<T extends CyclotronJobInvocation>(
    invocation: CyclotronJobInvocation,
    invocationParams: Pick<
        Partial<CyclotronJobInvocation>,
        'queue' | 'queuePriority' | 'queueMetadata' | 'queueScheduledAt' | 'queueParameters'
    > = {},
    resultParams: Pick<
        Partial<CyclotronJobInvocationResult>,
        | 'finished'
        | 'capturedInsightsEvents'
        | 'warehouseWebhookPayloads'
        | 'messageAssets'
        | 'logs'
        | 'metrics'
        | 'error'
        | 'execResult'
    > = {}
): CyclotronJobInvocationResult<T> {
    return {
        // Clone the invocation for the result cleaned
        finished: true,
        capturedInsightsEvents: [],
        warehouseWebhookPayloads: [],
        messageAssets: [],
        logs: [],
        metrics: [],
        ...resultParams,
        invocation: cloneInvocation(invocation, invocationParams) as T,
    }
}

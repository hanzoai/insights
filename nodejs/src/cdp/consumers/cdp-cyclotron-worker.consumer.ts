import { instrumented } from '~/common/tracing/tracing-utils'

import { HealthCheckResult, PluginsServerConfig } from '../../types'
import { logger } from '../../utils/logger'
import { captureException } from '../../utils/insights'
import { CyclotronJobQueue } from '../services/job-queue/job-queue'
import {
    CYCLOTRON_INVOCATION_JOB_QUEUES,
    CyclotronJobInvocation,
    CyclotronJobInvocationInsightsFunction,
    CyclotronJobInvocationResult,
    CyclotronJobQueueKind,
} from '../types'
import { isLegacyPluginInsightsFunction, isNativeInsightsFunction, isSegmentPluginInsightsFunction } from '../utils'
import { CdpConsumerBase, CdpConsumerBaseHub } from './cdp-base.consumer'

/**
 * Hub type for CdpCyclotronWorker.
 * Extends CdpConsumerBaseHub with cyclotron-specific fields.
 */
export type CdpCyclotronWorkerHub = CdpConsumerBaseHub &
    PluginsServerConfig & // For CyclotronJobQueue (to be narrowed later)
    Pick<PluginsServerConfig, 'CDP_CYCLOTRON_JOB_QUEUE_CONSUMER_KIND'>

/**
 * The future of the CDP consumer. This will be the main consumer that will handle all script jobs from Cyclotron
 */
export class CdpCyclotronWorker<
    THub extends CdpCyclotronWorkerHub = CdpCyclotronWorkerHub,
> extends CdpConsumerBase<THub> {
    protected name = 'CdpCyclotronWorker'
    protected cyclotronJobQueue: CyclotronJobQueue
    protected queue: CyclotronJobQueueKind

    constructor(hub: THub, queue?: CyclotronJobQueueKind) {
        super(hub)
        this.queue = queue ?? hub.CDP_CYCLOTRON_JOB_QUEUE_CONSUMER_KIND

        if (!CYCLOTRON_INVOCATION_JOB_QUEUES.includes(this.queue)) {
            throw new Error(`Invalid cyclotron job queue kind: ${this.queue}`)
        }

        this.cyclotronJobQueue = new CyclotronJobQueue(hub, this.queue, (batch) => this.processBatch(batch))
    }

    @instrumented('cdpConsumer.handleEachBatch.executeInvocations')
    public async processInvocations(invocations: CyclotronJobInvocation[]): Promise<CyclotronJobInvocationResult[]> {
        const loadedInvocations = await this.loadInsightsFunctions(invocations)

        return await Promise.all(
            loadedInvocations.map((item) => {
                if (isNativeInsightsFunction(item.insightsFunction)) {
                    return this.nativeDestinationExecutorService.execute(item)
                } else if (isLegacyPluginInsightsFunction(item.insightsFunction)) {
                    return this.pluginDestinationExecutorService.execute(item)
                } else if (isSegmentPluginInsightsFunction(item.insightsFunction)) {
                    return this.segmentDestinationExecutorService.execute(item)
                } else {
                    return this.scriptExecutor.executeWithAsyncFunctions(item)
                }
            })
        )
    }

    @instrumented('cdpConsumer.handleEachBatch.loadInsightsFunctions')
    protected async loadInsightsFunctions(
        invocations: CyclotronJobInvocation[]
    ): Promise<CyclotronJobInvocationInsightsFunction[]> {
        const loadedInvocations: CyclotronJobInvocationInsightsFunction[] = []
        const failedInvocations: CyclotronJobInvocation[] = []

        await Promise.all(
            invocations.map(async (item) => {
                const insightsFunction = await this.insightsFunctionManager.getInsightsFunction(item.functionId)
                if (!insightsFunction) {
                    logger.error('⚠️', 'Error finding custom function', {
                        id: item.functionId,
                    })

                    failedInvocations.push(item)

                    return null
                }

                if (!insightsFunction.enabled || insightsFunction.deleted) {
                    logger.info('⚠️', 'Skipping invocation due to custom function being deleted or disabled', {
                        id: item.functionId,
                    })

                    failedInvocations.push(item)

                    return null
                }

                loadedInvocations.push({
                    ...item,
                    state: item.state as CyclotronJobInvocationInsightsFunction['state'],
                    insightsFunction,
                })
            })
        )

        await this.cyclotronJobQueue.dequeueInvocations(failedInvocations)

        return loadedInvocations
    }

    public async processBatch(
        invocations: CyclotronJobInvocation[]
    ): Promise<{ backgroundTask: Promise<any>; invocationResults: CyclotronJobInvocationResult[] }> {
        if (!invocations.length) {
            return { backgroundTask: Promise.resolve(), invocationResults: [] }
        }

        logger.info('🔁', `${this.name} - handling batch`, {
            size: invocations.length,
        })

        const invocationResults = await this.processInvocations(invocations)

        // NOTE: We can queue and publish all metrics in the background whilst processing the next batch of invocations
        const backgroundTask = this.queueInvocationResults(invocationResults).then(() => {
            // NOTE: After this point we parallelize and any issues are logged rather than thrown as retrying now would end up in duplicate messages
            return Promise.allSettled([
                this.insightsFunctionMonitoringService
                    .queueInvocationResults(invocationResults)
                    .then(() => this.insightsFunctionMonitoringService.flush())
                    .catch((err) => {
                        captureException(err)
                        logger.error('Error processing invocation results', { err })
                    }),
                this.scriptWatcher.observeResults(invocationResults).catch((err: any) => {
                    captureException(err)
                    logger.error('Error observing results', { err })
                }),
            ])
        })

        return { backgroundTask, invocationResults }
    }

    protected async queueInvocationResults(invocations: CyclotronJobInvocationResult[]) {
        await this.cyclotronJobQueue.queueInvocationResults(invocations)
    }

    public async start() {
        await super.start()
        await this.cyclotronJobQueue.start()
    }

    public async stop() {
        logger.info('🔄', 'Stopping cyclotron worker consumer')
        await this.cyclotronJobQueue.stop()

        // IMPORTANT: super always comes last
        await super.stop()
    }

    public isHealthy(): HealthCheckResult {
        return this.cyclotronJobQueue.isHealthy()
    }
}

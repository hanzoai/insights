import { instrumented } from '~/common/tracing/tracing-utils'

import { HealthCheckResult, PluginsServerConfig } from '../../types'
import { logger } from '../../utils/logger'
import { captureException } from '../../utils/insights'
import { CyclotronJobQueue } from '../services/job-queue/job-queue'
import {
    CYCLOTRON_INVOCATION_JOB_QUEUES,
    CyclotronJobInvocation,
    CyclotronJobInvocationCustomFunction,
    CyclotronJobInvocationResult,
    CyclotronJobQueueKind,
} from '../types'
import { isLegacyPluginCustomFunction, isNativeCustomFunction, isSegmentPluginCustomFunction } from '../utils'
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
        const loadedInvocations = await this.loadCustomFunctions(invocations)

        return await Promise.all(
            loadedInvocations.map((item) => {
                if (isNativeCustomFunction(item.customFunction)) {
                    return this.nativeDestinationExecutorService.execute(item)
                } else if (isLegacyPluginCustomFunction(item.customFunction)) {
                    return this.pluginDestinationExecutorService.execute(item)
                } else if (isSegmentPluginCustomFunction(item.customFunction)) {
                    return this.segmentDestinationExecutorService.execute(item)
                } else {
                    return this.scriptExecutor.executeWithAsyncFunctions(item)
                }
            })
        )
    }

    @instrumented('cdpConsumer.handleEachBatch.loadCustomFunctions')
    protected async loadCustomFunctions(
        invocations: CyclotronJobInvocation[]
    ): Promise<CyclotronJobInvocationCustomFunction[]> {
        const loadedInvocations: CyclotronJobInvocationCustomFunction[] = []
        const failedInvocations: CyclotronJobInvocation[] = []

        await Promise.all(
            invocations.map(async (item) => {
                const customFunction = await this.customFunctionManager.getCustomFunction(item.functionId)
                if (!customFunction) {
                    logger.error('⚠️', 'Error finding custom function', {
                        id: item.functionId,
                    })

                    failedInvocations.push(item)

                    return null
                }

                if (!customFunction.enabled || customFunction.deleted) {
                    logger.info('⚠️', 'Skipping invocation due to custom function being deleted or disabled', {
                        id: item.functionId,
                    })

                    failedInvocations.push(item)

                    return null
                }

                loadedInvocations.push({
                    ...item,
                    state: item.state as CyclotronJobInvocationCustomFunction['state'],
                    customFunction,
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
                this.customFunctionMonitoringService
                    .queueInvocationResults(invocationResults)
                    .then(() => this.customFunctionMonitoringService.flush())
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

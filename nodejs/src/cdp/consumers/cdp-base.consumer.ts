// @ts-nocheck
import { RedisV2, createRedisV2PoolFromConfig } from '~/common/redis/redis-v2'

import { StreamProducerWrapper } from '../../stream/producer'
import { HealthCheckResult, Hub, PluginServerService, TeamId } from '../../types'
import { logger } from '../../utils/logger'
import { CdpFetchConfig, ScriptExecutorService, ScriptExecutorServiceHub } from '../services/script-executor.service'
import { InsightsFlowExecutorService } from '../services/insightsflows/insightsflow-executor.service'
import { InsightsFlowFunctionsService } from '../services/insightsflows/insightsflow-functions.service'
import { InsightsFlowManagerService } from '../services/insightsflows/insightsflow-manager.service'
import { LegacyPluginExecutorService } from '../services/legacy-plugin-executor.service'
import { GroupsManagerService, GroupsManagerServiceHub } from '../services/managers/groups-manager.service'
import { InsightsFunctionManagerHub, InsightsFunctionManagerService } from '../services/managers/insights-function-manager.service'
import { InsightsFunctionTemplateManagerService } from '../services/managers/insights-function-template-manager.service'
import { PersonsManagerService } from '../services/managers/persons-manager.service'
import { RecipientsManagerService } from '../services/managers/recipients-manager.service'
import { RecipientPreferencesService } from '../services/messaging/recipient-preferences.service'
import {
    InsightsFunctionMonitoringService,
    InsightsFunctionMonitoringServiceHub,
} from '../services/monitoring/insights-function-monitoring.service'
import { ScriptMaskerService } from '../services/monitoring/script-masker.service'
import { ScriptWatcherService, ScriptWatcherServiceHub } from '../services/monitoring/script-watcher.service'
import { NativeDestinationExecutorService } from '../services/native-destination-executor.service'
import { SegmentDestinationExecutorService } from '../services/segment-destination-executor.service'

/**
 * Combined Hub type for CdpConsumerBase and all CDP consumers.
 * This includes all fields needed by the base consumer and its services.
 */
export type CdpConsumerBaseHub = CdpFetchConfig &
    InsightsFunctionManagerHub &
    ScriptExecutorServiceHub &
    InsightsFunctionMonitoringServiceHub &
    ScriptWatcherServiceHub &
    GroupsManagerServiceHub &
    Pick<
        Hub,
        // Redis config
        | 'KV_URL'
        | 'KV_POOL_MIN_SIZE'
        | 'KV_POOL_MAX_SIZE'
        | 'CDP_KV_HOST'
        | 'CDP_KV_PORT'
        | 'CDP_KV_PASSWORD'
        // StreamProducerWrapper.create
        | 'STREAM_CLIENT_RACK'
        // PersonsManagerService needs personRepository
        | 'personRepository'
        // QuotaLimiting
        | 'quotaLimiting'
        // CDP overflow queue
        | 'CDP_OVERFLOW_QUEUE_ENABLED'
        // LegacyPluginExecutorService
        | 'postgres'
        | 'geoipService'
        // InsightsFlowManagerService
        | 'pubSub'
    >

export interface TeamIDWithConfig {
    teamId: TeamId | null
    consoleLogIngestionEnabled: boolean
}

export abstract class CdpConsumerBase<THub extends CdpConsumerBaseHub = CdpConsumerBaseHub> {
    redis: RedisV2
    isStopping = false

    scriptExecutor: ScriptExecutorService
    insightsFlowExecutor: InsightsFlowExecutorService
    scriptMasker: ScriptMaskerService
    scriptWatcher: ScriptWatcherService

    groupsManager: GroupsManagerService
    insightsFlowManager: InsightsFlowManagerService
    insightsFunctionManager: InsightsFunctionManagerService
    insightsFunctionTemplateManager: InsightsFunctionTemplateManagerService
    insightsFlowFunctionsService: InsightsFlowFunctionsService
    personsManager: PersonsManagerService
    recipientsManager: RecipientsManagerService

    insightsFunctionMonitoringService: InsightsFunctionMonitoringService
    nativeDestinationExecutorService: NativeDestinationExecutorService
    pluginDestinationExecutorService: LegacyPluginExecutorService
    recipientPreferencesService: RecipientPreferencesService
    segmentDestinationExecutorService: SegmentDestinationExecutorService

    protected streamProducer?: StreamProducerWrapper
    protected abstract name: string

    protected heartbeat = () => {}

    constructor(protected hub: THub) {
        // CDP consumers use their own Redis instance with fallback to default
        this.redis = createRedisV2PoolFromConfig({
            connection: hub.CDP_KV_HOST
                ? {
                      url: hub.CDP_KV_HOST,
                      options: { port: hub.CDP_KV_PORT, password: hub.CDP_KV_PASSWORD },
                      name: 'cdp-kv',
                  }
                : { url: hub.KV_URL, name: 'cdp-kv-fallback' },
            poolMinSize: hub.KV_POOL_MIN_SIZE,
            poolMaxSize: hub.KV_POOL_MAX_SIZE,
        })
        this.insightsFunctionManager = new InsightsFunctionManagerService(hub)
        this.insightsFlowManager = new InsightsFlowManagerService(hub.postgres, hub.pubSub)
        this.scriptWatcher = new ScriptWatcherService(hub, this.redis)
        this.scriptMasker = new ScriptMaskerService(this.redis)
        this.scriptExecutor = new ScriptExecutorService(this.hub)
        this.insightsFunctionTemplateManager = new InsightsFunctionTemplateManagerService(this.hub.postgres)
        this.insightsFlowFunctionsService = new InsightsFlowFunctionsService(
            this.hub.SITE_URL,
            this.insightsFunctionTemplateManager,
            this.scriptExecutor
        )

        this.recipientsManager = new RecipientsManagerService(this.hub.postgres)
        this.recipientPreferencesService = new RecipientPreferencesService(this.recipientsManager)
        this.insightsFlowExecutor = new InsightsFlowExecutorService(
            this.insightsFlowFunctionsService,
            this.recipientPreferencesService
        )

        this.personsManager = new PersonsManagerService(this.hub.personRepository)
        this.groupsManager = new GroupsManagerService(this.hub)
        this.insightsFunctionMonitoringService = new InsightsFunctionMonitoringService(this.hub)
        this.pluginDestinationExecutorService = new LegacyPluginExecutorService(
            this.hub.postgres,
            this.hub.geoipService
        )
        this.nativeDestinationExecutorService = new NativeDestinationExecutorService(this.hub)
        this.segmentDestinationExecutorService = new SegmentDestinationExecutorService(this.hub)
    }

    public get service(): PluginServerService {
        return {
            id: this.name,
            onShutdown: async () => await this.stop(),
            healthcheck: () => this.isHealthy(),
        }
    }

    protected async runWithHeartbeat<T>(func: () => Promise<T> | T): Promise<T> {
        // Helper function to ensure that looping over lots of custom functions doesn't block up the thread, killing the consumer
        const res = await func()
        this.heartbeat()
        await new Promise((resolve) => process.nextTick(resolve))

        return res
    }

    public async start(): Promise<void> {
        // NOTE: This is only for starting shared services
        await Promise.all([
            StreamProducerWrapper.create(this.hub.STREAM_CLIENT_RACK).then((producer) => {
                this.streamProducer = producer
            }),
        ])
    }

    public async stop(): Promise<void> {
        logger.info('🔁', `${this.name} - stopping`)
        this.isStopping = true

        // Mark as stopping so that we don't actually process any more incoming messages, but still keep the process alive
        logger.info('🔁', `${this.name} - stopping stream producer`)
        await this.streamProducer?.disconnect()
        logger.info('👍', `${this.name} - stopped!`)
    }

    public abstract isHealthy(): HealthCheckResult
}

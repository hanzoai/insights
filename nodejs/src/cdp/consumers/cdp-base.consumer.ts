import { GroupReadRepository } from '~/common/groups/repositories/group-repository.interface'
import { PersonReadRepository } from '~/common/persons/repositories/person-repository'
import { RedisV2 } from '~/common/redis/redis-v2'
import { QuotaLimiting } from '~/common/services/quota-limiting.service'
import { GeoIPService } from '~/common/utils/geoip'
import { logger } from '~/common/utils/logger'

import type { CommonConfig } from '../../common/config'
import { HealthCheckResult, PluginServerService, TeamId } from '../../types'
import {
    CdpCoreServicesConfig,
    CdpCoreServicesDeps,
    CdpOutputs,
    CdpValkeyShadowPools,
    createCdpCoreServices,
} from '../cdp-services'
import type { CdpConfig } from '../config'
import { HogExecutorService } from '../services/script-executor.service'
import { HogInputsService } from '../services/script-inputs.service'
import { InsightsFlowExecutorService } from '../services/insightsflows/hogflow-executor.service'
import { InsightsFlowFunctionsService } from '../services/insightsflows/hogflow-functions.service'
import { InsightsFlowManagerService } from '../services/insightsflows/hogflow-manager.service'
import { InvocationResultsService } from '../services/invocation-results.service'
import { LegacyPluginExecutorService } from '../services/legacy-plugin-executor.service'
import { GroupsManagerService } from '../services/managers/groups-manager.service'
import { InsightsFunctionManagerService } from '../services/managers/script-function-manager.service'
import { InsightsFunctionTemplateManagerService } from '../services/managers/script-function-template-manager.service'
import { PersonsManagerService } from '../services/managers/persons-manager.service'
import { RecipientsManagerService } from '../services/managers/recipients-manager.service'
import { EmailService } from '../services/messaging/email.service'
import { RecipientPreferencesService } from '../services/messaging/recipient-preferences.service'
import { InsightsFunctionMonitoringService } from '../services/monitoring/script-function-monitoring.service'
import { HogMaskerService } from '../services/monitoring/script-masker.service'
import { HogWatcherService } from '../services/monitoring/script-watcher.service'
import { NativeDestinationExecutorService } from '../services/native-destination-executor.service'
import { SegmentDestinationExecutorService } from '../services/segment-destination-executor.service'

export type CdpConsumerBaseConfig = CdpCoreServicesConfig &
    Pick<CommonConfig, 'KAFKA_CLIENT_RACK'> &
    Pick<CdpConfig, 'CDP_OVERFLOW_QUEUE_ENABLED'>

export interface CdpConsumerBaseDeps extends CdpCoreServicesDeps {
    personRepository: PersonReadRepository
    geoipService: GeoIPService
    groupRepository: GroupReadRepository
    quotaLimiting: QuotaLimiting
}

export interface TeamIDWithConfig {
    teamId: TeamId | null
    consoleLogIngestionEnabled: boolean
}

export abstract class CdpConsumerBase<TConfig extends CdpConsumerBaseConfig = CdpConsumerBaseConfig> {
    redis: RedisV2
    valkeyShadow: CdpValkeyShadowPools | null
    isStopping = false

    hogExecutor: HogExecutorService
    hogInputsService: HogInputsService
    hogFlowExecutor: InsightsFlowExecutorService
    hogMasker: HogMaskerService
    hogWatcher: HogWatcherService
    hogWatcherMirror: HogWatcherService | null

    groupsManager: GroupsManagerService
    hogFlowManager: InsightsFlowManagerService
    insightsFunctionManager: InsightsFunctionManagerService
    insightsFunctionTemplateManager: InsightsFunctionTemplateManagerService
    hogFlowFunctionsService: InsightsFlowFunctionsService
    personsManager: PersonsManagerService
    recipientsManager: RecipientsManagerService

    emailService: EmailService
    insightsFunctionMonitoringService: InsightsFunctionMonitoringService
    invocationResultsService: InvocationResultsService
    nativeDestinationExecutorService: NativeDestinationExecutorService
    pluginDestinationExecutorService: LegacyPluginExecutorService
    recipientPreferencesService: RecipientPreferencesService
    segmentDestinationExecutorService: SegmentDestinationExecutorService

    protected outputs: CdpOutputs
    protected abstract name: string

    constructor(
        protected config: TConfig,
        protected deps: CdpConsumerBaseDeps
    ) {
        const services = createCdpCoreServices(config, deps)

        this.redis = services.redis
        this.valkeyShadow = services.valkeyShadow
        this.insightsFunctionManager = services.insightsFunctionManager
        this.hogFlowManager = services.hogFlowManager
        this.hogWatcher = services.hogWatcher
        this.hogWatcherMirror = services.hogWatcherMirror
        this.hogExecutor = services.hogExecutor
        this.hogInputsService = services.hogInputsService
        this.insightsFunctionTemplateManager = services.insightsFunctionTemplateManager
        this.hogFlowFunctionsService = services.hogFlowFunctionsService
        this.recipientsManager = services.recipientsManager
        this.recipientPreferencesService = services.recipientPreferencesService
        this.hogFlowExecutor = services.hogFlowExecutor
        this.emailService = services.emailService
        this.insightsFunctionMonitoringService = services.insightsFunctionMonitoringService
        this.invocationResultsService = services.invocationResultsService
        this.nativeDestinationExecutorService = services.nativeDestinationExecutorService
        this.segmentDestinationExecutorService = services.segmentDestinationExecutorService
        this.outputs = services.outputs

        // Base-only services
        this.hogMasker = new HogMaskerService(services.redis, services.valkeyShadow?.writer ?? null)
        this.personsManager = new PersonsManagerService(deps.teamManager, deps.personRepository, config.SITE_URL)
        this.groupsManager = new GroupsManagerService(deps.teamManager, deps.groupRepository)
        this.pluginDestinationExecutorService = new LegacyPluginExecutorService(deps.postgres, deps.geoipService)
    }

    public get service(): PluginServerService {
        return {
            id: this.name,
            onShutdown: async () => await this.stop(),
            healthcheck: () => this.isHealthy(),
        }
    }

    public async start(): Promise<void> {
        // Outputs are resolved in the constructor via `createCdpCoreServices` — no
        // per-consumer producer lifecycle. The outer server owns producer shutdown
        // through `cdpProducerRegistry.disconnectAll()`.
    }

    public stop(): Promise<void> {
        logger.info('🔁', `${this.name} - stopping`)
        this.isStopping = true
        logger.info('👍', `${this.name} - stopped!`)
        return Promise.resolve()
    }

    public abstract isHealthy(): HealthCheckResult
}

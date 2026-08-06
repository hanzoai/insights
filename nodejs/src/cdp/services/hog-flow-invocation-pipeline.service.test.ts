import { QuotaLimiting } from '../../common/services/quota-limiting.service'
import { InsightsFunctionInvocationGlobals } from '../types'
import { InsightsFlowInvocationPipeline } from './script-flow-invocation-pipeline.service'
import { InsightsFlowExecutorService } from './insightsflows/hogflow-executor.service'
import { InsightsFlowManagerService } from './insightsflows/hogflow-manager.service'
import { InsightsFunctionMonitoringService } from './monitoring/script-function-monitoring.service'
import { HogMaskerService } from './monitoring/script-masker.service'
import { HogWatcherService, HogWatcherState } from './monitoring/script-watcher.service'

jest.mock('../../common/services/keyed-rate-limiter.service', () => ({
    KeyedRateLimiterService: jest.fn().mockImplementation(() => ({
        rateLimitGrouped: jest.fn(),
    })),
}))

const config = {
    CDP_RATE_LIMITER_BUCKET_SIZE: 100,
    CDP_RATE_LIMITER_REFILL_RATE: 10,
    CDP_RATE_LIMITER_TTL: 60,
}

function makeInsightsFlowInvocation(hogFlowId = 'flow-1', overrides: { billable_action_types?: string[] } = {}) {
    return {
        id: `inv-${hogFlowId}`,
        teamId: 1,
        functionId: hogFlowId,
        queue: 'hogflow',
        queuePriority: 0,
        hogFlow: { id: hogFlowId, name: 'test flow', billable_action_types: overrides.billable_action_types ?? [] },
        state: { event: { uuid: 'evt-1' } },
        person: undefined,
    } as any
}

function makeGlobals(teamId = 1): InsightsFunctionInvocationGlobals {
    return { project: { id: teamId } } as InsightsFunctionInvocationGlobals
}

describe('InsightsFlowInvocationPipeline', () => {
    let hogFlowManager: jest.Mocked<InsightsFlowManagerService>
    let hogFlowExecutor: jest.Mocked<InsightsFlowExecutorService>
    let hogWatcher: jest.Mocked<HogWatcherService>
    let hogMasker: jest.Mocked<HogMaskerService>
    let insightsFunctionMonitoringService: jest.Mocked<InsightsFunctionMonitoringService>
    let quotaLimiting: jest.Mocked<QuotaLimiting>
    let pipeline: InsightsFlowInvocationPipeline
    let rateLimitGroupedMock: jest.Mock

    beforeEach(() => {
        hogFlowManager = {
            getInsightsFlowsForTeams: jest.fn().mockResolvedValue({}),
        } as unknown as jest.Mocked<InsightsFlowManagerService>

        hogFlowExecutor = {
            buildInsightsFlowInvocations: jest.fn().mockResolvedValue({ invocations: [], metrics: [], logs: [] }),
        } as unknown as jest.Mocked<InsightsFlowExecutorService>

        hogWatcher = {
            getEffectiveStates: jest.fn().mockResolvedValue({}),
        } as unknown as jest.Mocked<HogWatcherService>

        hogMasker = {
            filterByMasking: jest.fn((invocations) => Promise.resolve({ masked: [], notMasked: invocations })),
        } as unknown as jest.Mocked<HogMaskerService>

        insightsFunctionMonitoringService = {
            queueAppMetrics: jest.fn(),
            queueAppMetric: jest.fn(),
            queueLogs: jest.fn(),
        } as unknown as jest.Mocked<InsightsFunctionMonitoringService>

        quotaLimiting = {
            isTeamQuotaLimited: jest.fn().mockResolvedValue(false),
        } as unknown as jest.Mocked<QuotaLimiting>

        pipeline = new InsightsFlowInvocationPipeline(config, {
            hogFlowManager,
            hogFlowExecutor,
            hogWatcher,
            hogWatcherMirror: null,
            hogMasker,
            insightsFunctionMonitoringService,
            quotaLimiting,
            redis: {} as any,
            valkeyShadow: null,
        })

        rateLimitGroupedMock = (pipeline as any).hogRateLimiter.rateLimitGrouped as jest.Mock
        rateLimitGroupedMock.mockResolvedValue([])
    })

    it('returns empty when no insightsflows match', async () => {
        const result = await pipeline.buildInvocations([makeGlobals()])
        expect(result).toEqual([])
        expect(hogFlowManager.getInsightsFlowsForTeams).toHaveBeenCalledWith([1])
    })

    it('returns invocations for matching insightsflows and queues triggered metric', async () => {
        const inv = makeInsightsFlowInvocation()
        hogFlowExecutor.buildInsightsFlowInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({ [inv.hogFlow.id]: { state: HogWatcherState.healthy } } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: false }]])

        const result = await pipeline.buildInvocations([makeGlobals()])

        expect(result).toEqual([inv])
        expect(insightsFunctionMonitoringService.queueAppMetrics).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ metric_name: 'triggered' })]),
            'hog_flow'
        )
    })

    it('drops rate-limited invocations with metric + log', async () => {
        const inv = makeInsightsFlowInvocation()
        hogFlowExecutor.buildInsightsFlowInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({ [inv.hogFlow.id]: { state: HogWatcherState.healthy } } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: true }]])

        const result = await pipeline.buildInvocations([makeGlobals()])

        expect(result).toEqual([])
        expect(insightsFunctionMonitoringService.queueAppMetric).toHaveBeenCalledWith(
            expect.objectContaining({ metric_name: 'rate_limited' }),
            'hog_flow'
        )
        expect(insightsFunctionMonitoringService.queueLogs).toHaveBeenCalled()
    })

    it('drops quota-limited invocations', async () => {
        // hogflow quota helper short-circuits when billable_action_types is empty
        const inv = makeInsightsFlowInvocation('flow-1', { billable_action_types: ['function_email'] })
        hogFlowExecutor.buildInsightsFlowInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({ [inv.hogFlow.id]: { state: HogWatcherState.healthy } } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: false }]])
        quotaLimiting.isTeamQuotaLimited.mockResolvedValue(true)

        const result = await pipeline.buildInvocations([makeGlobals()])
        expect(result).toEqual([])
    })

    it('drops invocations for disabled insightsflows', async () => {
        const inv = makeInsightsFlowInvocation()
        hogFlowExecutor.buildInsightsFlowInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({
            [inv.hogFlow.id]: { state: HogWatcherState.disabled },
        } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: false }]])

        const result = await pipeline.buildInvocations([makeGlobals()])

        expect(result).toEqual([])
        expect(insightsFunctionMonitoringService.queueAppMetric).toHaveBeenCalledWith(
            expect.objectContaining({ metric_name: 'disabled_permanently' }),
            'hog_flow'
        )
    })

    it('sets queuePriority=2 for degraded insightsflows but does not change queue', async () => {
        const inv = makeInsightsFlowInvocation()
        hogFlowExecutor.buildInsightsFlowInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({
            [inv.hogFlow.id]: { state: HogWatcherState.degraded },
        } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: false }]])

        const result = await pipeline.buildInvocations([makeGlobals()])

        expect(result).toHaveLength(1)
        expect(result[0].queuePriority).toBe(2)
        expect(result[0].queue).toBe('hogflow')
    })

    it('drops masked invocations', async () => {
        const inv = makeInsightsFlowInvocation()
        hogFlowExecutor.buildInsightsFlowInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({ [inv.hogFlow.id]: { state: HogWatcherState.healthy } } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: false }]])
        hogMasker.filterByMasking.mockResolvedValue({ masked: [inv], notMasked: [] })

        const result = await pipeline.buildInvocations([makeGlobals()])

        expect(result).toEqual([])
        expect(insightsFunctionMonitoringService.queueAppMetrics).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ metric_name: 'masked' })]),
            'hog_flow'
        )
    })
})

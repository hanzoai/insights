import { QuotaLimiting } from '../../common/services/quota-limiting.service'
import { CyclotronJobInvocationInsightsFunction, InsightsFunctionInvocationGlobals, InsightsFunctionType } from '../types'
import { HogExecutorService } from './script-executor.service'
import { InsightsFunctionInvocationPipeline } from './script-function-invocation-pipeline.service'
import { InsightsFunctionManagerService } from './managers/script-function-manager.service'
import { InsightsFunctionMonitoringService } from './monitoring/script-function-monitoring.service'
import { HogMaskerService } from './monitoring/script-masker.service'
import { HogWatcherService, HogWatcherState } from './monitoring/script-watcher.service'

// Mock the rate limiter to give us deterministic control
jest.mock('../../common/services/keyed-rate-limiter.service', () => ({
    KeyedRateLimiterService: jest.fn().mockImplementation(() => ({
        rateLimitGrouped: jest.fn(),
    })),
}))

const config = {
    CDP_RATE_LIMITER_BUCKET_SIZE: 100,
    CDP_RATE_LIMITER_REFILL_RATE: 10,
    CDP_RATE_LIMITER_TTL: 60,
    CDP_OVERFLOW_QUEUE_ENABLED: true,
}

function makeInsightsFunction(overrides: Partial<InsightsFunctionType> = {}): InsightsFunctionType {
    return {
        id: overrides.id ?? 'fn-1',
        team_id: 1,
        type: 'destination',
        filters: { source: 'events' },
        enabled: true,
        deleted: false,
        ...overrides,
    } as InsightsFunctionType
}

function makeInvocation(insightsFunction: InsightsFunctionType, eventUuid = 'evt-1'): CyclotronJobInvocationInsightsFunction {
    return {
        id: `inv-${insightsFunction.id}`,
        teamId: insightsFunction.team_id,
        functionId: insightsFunction.id,
        queue: 'script',
        queuePriority: 0,
        state: {
            globals: { event: { uuid: eventUuid } },
        } as any,
        insightsFunction,
    } as CyclotronJobInvocationInsightsFunction
}

function makeGlobals(teamId = 1): InsightsFunctionInvocationGlobals {
    return { project: { id: teamId } } as InsightsFunctionInvocationGlobals
}

describe('InsightsFunctionInvocationPipeline', () => {
    let insightsFunctionManager: jest.Mocked<InsightsFunctionManagerService>
    let hogExecutor: jest.Mocked<HogExecutorService>
    let hogWatcher: jest.Mocked<HogWatcherService>
    let hogMasker: jest.Mocked<HogMaskerService>
    let insightsFunctionMonitoringService: jest.Mocked<InsightsFunctionMonitoringService>
    let quotaLimiting: jest.Mocked<QuotaLimiting>
    let pipeline: InsightsFunctionInvocationPipeline
    let rateLimitGroupedMock: jest.Mock

    beforeEach(() => {
        insightsFunctionManager = {
            getInsightsFunctionsForTeams: jest.fn().mockResolvedValue({}),
        } as unknown as jest.Mocked<InsightsFunctionManagerService>

        hogExecutor = {
            buildInsightsFunctionInvocations: jest.fn().mockResolvedValue({ invocations: [], metrics: [], logs: [] }),
        } as unknown as jest.Mocked<HogExecutorService>

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

        pipeline = new InsightsFunctionInvocationPipeline(config, {
            insightsFunctionManager,
            hogExecutor,
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

    it('returns empty when no script functions match', async () => {
        const result = await pipeline.buildInvocations([makeGlobals()], {
            hogTypes: ['destination'],
            filterFn: () => true,
        })
        expect(result).toEqual([])
        expect(insightsFunctionManager.getInsightsFunctionsForTeams).toHaveBeenCalledWith(
            [1],
            ['destination'],
            expect.any(Function)
        )
    })

    it('returns invocations for matching script functions and queues triggered + billing metrics', async () => {
        const fn = makeInsightsFunction()
        const inv = makeInvocation(fn, 'evt-uuid-1')
        hogExecutor.buildInsightsFunctionInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({ [fn.id]: { state: HogWatcherState.healthy } } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: false }]])

        const result = await pipeline.buildInvocations([makeGlobals()], {
            hogTypes: ['destination'],
            filterFn: () => true,
        })

        expect(result).toEqual([inv])
        const metricsCall = insightsFunctionMonitoringService.queueAppMetrics.mock.calls.find((c) =>
            c[0].some((m: any) => m.metric_name === 'triggered')
        )
        expect(metricsCall).toBeDefined()
        const billingCall = insightsFunctionMonitoringService.queueAppMetrics.mock.calls.find((c) =>
            c[0].some((m: any) => m.metric_name === 'billable_invocation')
        )
        expect(billingCall).toBeDefined()
    })

    it('drops invocations in disabled watcher state', async () => {
        const fn = makeInsightsFunction()
        const inv = makeInvocation(fn)
        hogExecutor.buildInsightsFunctionInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({ [fn.id]: { state: HogWatcherState.disabled } } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: false }]])

        const result = await pipeline.buildInvocations([makeGlobals()], {
            hogTypes: ['destination'],
            filterFn: () => true,
        })

        expect(result).toEqual([])
        expect(insightsFunctionMonitoringService.queueAppMetric).toHaveBeenCalledWith(
            expect.objectContaining({ metric_name: 'disabled_permanently' }),
            'insights_function'
        )
    })

    it('routes degraded invocations to hogoverflow queue when overflow enabled', async () => {
        const fn = makeInsightsFunction()
        const inv = makeInvocation(fn)
        hogExecutor.buildInsightsFunctionInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({ [fn.id]: { state: HogWatcherState.degraded } } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: false }]])

        const result = await pipeline.buildInvocations([makeGlobals()], {
            hogTypes: ['destination'],
            filterFn: () => true,
        })

        expect(result).toHaveLength(1)
        expect(result[0].queuePriority).toBe(2)
        expect(result[0].queue).toBe('hogoverflow')
    })

    it('drops quota-limited invocations', async () => {
        const fn = makeInsightsFunction()
        const inv = makeInvocation(fn)
        hogExecutor.buildInsightsFunctionInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({ [fn.id]: { state: HogWatcherState.healthy } } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: false }]])
        quotaLimiting.isTeamQuotaLimited.mockResolvedValue(true)

        const result = await pipeline.buildInvocations([makeGlobals()], {
            hogTypes: ['destination'],
            filterFn: () => true,
        })

        expect(result).toEqual([])
    })

    it('drops masked invocations', async () => {
        const fn = makeInsightsFunction()
        const inv = makeInvocation(fn)
        hogExecutor.buildInsightsFunctionInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({ [fn.id]: { state: HogWatcherState.healthy } } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: false }]])
        hogMasker.filterByMasking.mockResolvedValue({ masked: [inv], notMasked: [] })

        const result = await pipeline.buildInvocations([makeGlobals()], {
            hogTypes: ['destination'],
            filterFn: () => true,
        })

        expect(result).toEqual([])
        expect(insightsFunctionMonitoringService.queueAppMetrics).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ metric_name: 'masked' })]),
            'insights_function'
        )
    })

    it('bills only once per unique event uuid even with multiple destinations', async () => {
        const fn1 = makeInsightsFunction({ id: 'fn-1' })
        const fn2 = makeInsightsFunction({ id: 'fn-2' })
        const inv1 = makeInvocation(fn1, 'evt-same')
        const inv2 = makeInvocation(fn2, 'evt-same')
        hogExecutor.buildInsightsFunctionInvocations.mockResolvedValue({ invocations: [inv1, inv2], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({
            [fn1.id]: { state: HogWatcherState.healthy },
            [fn2.id]: { state: HogWatcherState.healthy },
        } as any)
        rateLimitGroupedMock.mockResolvedValue([
            [null, { isRateLimited: false }],
            [null, { isRateLimited: false }],
        ])

        await pipeline.buildInvocations([makeGlobals()], {
            hogTypes: ['destination'],
            filterFn: () => true,
        })

        const billingMetrics = insightsFunctionMonitoringService.queueAppMetrics.mock.calls
            .flatMap((c) => c[0])
            .filter((m: any) => m.metric_name === 'billable_invocation')
        expect(billingMetrics).toHaveLength(1)
    })

    it('does not drop rate-limited invocations (monitoring-only)', async () => {
        const fn = makeInsightsFunction()
        const inv = makeInvocation(fn)
        hogExecutor.buildInsightsFunctionInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({ [fn.id]: { state: HogWatcherState.healthy } } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: true }]])

        const result = await pipeline.buildInvocations([makeGlobals()], {
            hogTypes: ['destination'],
            filterFn: () => true,
        })

        expect(result).toHaveLength(1)
    })
})

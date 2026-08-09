import { QuotaLimiting } from '../../common/services/quota-limiting.service'
import { InsightsFunctionInvocationGlobals } from '../types'
import { FlowInvocationPipeline } from './script-flow-invocation-pipeline.service'
import { FlowExecutorService } from './flows/flow-executor.service'
import { FlowManagerService } from './flows/flow-manager.service'
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

function makeFlowInvocation(flowId = 'flow-1', overrides: { billable_action_types?: string[] } = {}) {
    return {
        id: `inv-${flowId}`,
        teamId: 1,
        functionId: flowId,
        queue: 'hogflow',
        queuePriority: 0,
        flow: {
            id: flowId,
            name: 'test flow',
            version: 5,
            billable_action_types: overrides.billable_action_types ?? [],
        },
        state: { event: { uuid: 'evt-1' } },
        person: undefined,
    } as any
}

function makeGlobals(teamId = 1): InsightsFunctionInvocationGlobals {
    return { project: { id: teamId } } as InsightsFunctionInvocationGlobals
}

describe('FlowInvocationPipeline', () => {
    let flowManager: jest.Mocked<FlowManagerService>
    let flowExecutor: jest.Mocked<FlowExecutorService>
    let hogWatcher: jest.Mocked<HogWatcherService>
    let hogMasker: jest.Mocked<HogMaskerService>
    let insightsFunctionMonitoringService: jest.Mocked<InsightsFunctionMonitoringService>
    let quotaLimiting: jest.Mocked<QuotaLimiting>
    let pipeline: FlowInvocationPipeline
    let rateLimitGroupedMock: jest.Mock

    beforeEach(() => {
        flowManager = {
            getFlowsForTeams: jest.fn().mockResolvedValue({}),
        } as unknown as jest.Mocked<FlowManagerService>

        flowExecutor = {
            buildFlowInvocations: jest.fn().mockResolvedValue({ invocations: [], metrics: [], logs: [] }),
        } as unknown as jest.Mocked<FlowExecutorService>

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

        pipeline = new FlowInvocationPipeline(config, {
            flowManager,
            flowExecutor,
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

    it('returns empty when no flows match', async () => {
        const result = await pipeline.buildInvocations([makeGlobals()])
        expect(result).toEqual([])
        expect(flowManager.getFlowsForTeams).toHaveBeenCalledWith([1])
    })

    it('returns invocations for matching flows and queues triggered metric', async () => {
        const inv = makeFlowInvocation()
        flowExecutor.buildFlowInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({ [inv.flow.id]: { state: HogWatcherState.healthy } } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: false }]])

        const result = await pipeline.buildInvocations([makeGlobals()])

        expect(result).toEqual([inv])
        expect(insightsFunctionMonitoringService.queueAppMetrics).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    metric_name: 'triggered',
                    app_source_version: { id: expect.any(String), version: 5 },
                }),
            ]),
            'hog_flow'
        )
    })

    it('drops rate-limited invocations with metric + log', async () => {
        const inv = makeFlowInvocation()
        flowExecutor.buildFlowInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({ [inv.flow.id]: { state: HogWatcherState.healthy } } as any)
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
        const inv = makeFlowInvocation('flow-1', { billable_action_types: ['function_email'] })
        flowExecutor.buildFlowInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({ [inv.flow.id]: { state: HogWatcherState.healthy } } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: false }]])
        quotaLimiting.isTeamQuotaLimited.mockResolvedValue(true)

        const result = await pipeline.buildInvocations([makeGlobals()])
        expect(result).toEqual([])
    })

    it('drops invocations for disabled flows', async () => {
        const inv = makeFlowInvocation()
        flowExecutor.buildFlowInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({
            [inv.flow.id]: { state: HogWatcherState.disabled },
        } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: false }]])

        const result = await pipeline.buildInvocations([makeGlobals()])

        expect(result).toEqual([])
        expect(insightsFunctionMonitoringService.queueAppMetric).toHaveBeenCalledWith(
            expect.objectContaining({ metric_name: 'disabled_permanently' }),
            'hog_flow'
        )
    })

    it('sets queuePriority=2 for degraded flows but does not change queue', async () => {
        const inv = makeFlowInvocation()
        flowExecutor.buildFlowInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({
            [inv.flow.id]: { state: HogWatcherState.degraded },
        } as any)
        rateLimitGroupedMock.mockResolvedValue([[null, { isRateLimited: false }]])

        const result = await pipeline.buildInvocations([makeGlobals()])

        expect(result).toHaveLength(1)
        expect(result[0].queuePriority).toBe(2)
        expect(result[0].queue).toBe('hogflow')
    })

    it('drops masked invocations', async () => {
        const inv = makeFlowInvocation()
        flowExecutor.buildFlowInvocations.mockResolvedValue({ invocations: [inv], metrics: [], logs: [] })
        hogWatcher.getEffectiveStates.mockResolvedValue({ [inv.flow.id]: { state: HogWatcherState.healthy } } as any)
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

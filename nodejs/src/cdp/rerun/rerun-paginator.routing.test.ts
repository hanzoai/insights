import { DateTime } from 'luxon'

import { CyclotronJobConflictError } from '../services/cyclotron-v2'
import { InsightsFlowManagerService } from '../services/insightsflows/hogflow-manager.service'
import { CyclotronJobQueuePostgresV2 } from '../services/job-queue/job-queue-postgres-v2'
import { JobQueue } from '../services/job-queue/job-queue.interface'
import { InsightsFunctionManagerService } from '../services/managers/script-function-manager.service'
import { InsightsFunctionMonitoringService } from '../services/monitoring/script-function-monitoring.service'
import { HogInvocationResultsService } from '../services/monitoring/script-invocation-results.service'
import { RerunFunctionKind, RerunJobState } from './rerun-job.types'
import { RerunPaginatorService } from './rerun-paginator.service'

/**
 * Unit tests for the paginator's re-enqueue routing. A rerun job is scoped to
 * one function kind, so a whole page routes to one backend — script functions to
 * kafka, script flows to postgres-v2, the same split cdp-events-consumer uses.
 *
 * Datastore + rehydration are stubbed (private `fetchPage` / `rehydrateBatch`)
 * so these run without infra; the real CH paths are covered by
 * `rerun-paginator.service.test.ts`.
 */
describe('RerunPaginatorService queue routing', () => {
    let hogQueue: jest.Mocked<JobQueue>
    let hogflowQueue: jest.Mocked<CyclotronJobQueuePostgresV2>
    let paginator: RerunPaginatorService

    beforeEach(() => {
        hogQueue = {
            queueInvocations: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<JobQueue>
        hogflowQueue = {
            queueInvocations: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<CyclotronJobQueuePostgresV2>

        const invocationResultsRowsService = {
            queueLifecycleRow: jest.fn(),
            queueRerunWrapperRow: jest.fn(),
            dropQueuedRowsFor: jest.fn(),
            flush: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<HogInvocationResultsService>

        const monitoringService = {
            queueLogs: jest.fn(),
            flush: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<InsightsFunctionMonitoringService>

        paginator = new RerunPaginatorService(
            {} as any,
            {} as unknown as InsightsFunctionManagerService,
            {} as unknown as InsightsFlowManagerService,
            invocationResultsRowsService,
            { insights_function: hogQueue, hog_flow: hogflowQueue },
            monitoringService,
            10000
        )
    })

    const buildState = (kind: RerunFunctionKind): RerunJobState => ({
        function_kind: kind,
        function_id: kind === 'hog_flow' ? 'flow-1' : 'fn-1',
        request: { filter: { window_start: '2026-01-01T00:00:00Z', window_end: '2027-01-01T00:00:00Z' } },
        progress: { queued: 0, skipped: 0, done: false },
    })

    // Stub the CH query + rehydration so the test exercises only the routing.
    // `fetchRunningInvocationIds` (the kafka-path in-flight guard) defaults to
    // "nothing in flight" so routing tests aren't affected by it.
    const stubPage = (ids: string[]): void => {
        jest.spyOn(paginator as any, 'fetchPage').mockResolvedValue([])
        jest.spyOn(paginator as any, 'rehydrateBatch').mockResolvedValue({
            queued: ids.length,
            skipped: 0,
            queuedInvocations: ids.map((id) => ({ id })),
        })
        jest.spyOn(paginator as any, 'fetchRunningInvocationIds').mockResolvedValue(new Set<string>())
    }

    const runPage = (state: RerunJobState) =>
        paginator.processPage(1, state, { jobId: 'test-rerun-job', createdAt: DateTime.now() })

    it('routes insights_function reruns to the kafka (script) queue, not the hogflow queue', async () => {
        stubPage(['inv-1', 'inv-2'])

        await runPage(buildState('insights_function'))

        expect(hogQueue.queueInvocations).toHaveBeenCalledTimes(1)
        expect((hogQueue.queueInvocations.mock.calls[0][0] as any[]).map((i) => i.id)).toEqual(['inv-1', 'inv-2'])
        expect(hogflowQueue.queueInvocations).not.toHaveBeenCalled()
    })

    it('routes hog_flow reruns to the postgres-v2 (hogflow) queue with overwriteExisting', async () => {
        stubPage(['inv-1', 'inv-2'])

        await runPage(buildState('hog_flow'))

        expect(hogflowQueue.queueInvocations).toHaveBeenCalledTimes(1)
        expect((hogflowQueue.queueInvocations.mock.calls[0][0] as any[]).map((i) => i.id)).toEqual(['inv-1', 'inv-2'])
        // postgres-v2 re-enqueue re-uses the original invocation_id, so it must
        // upsert over the prior terminal row.
        expect(hogflowQueue.queueInvocations.mock.calls[0][1]).toEqual({ overwriteExisting: true })
        expect(hogQueue.queueInvocations).not.toHaveBeenCalled()
    })

    it('skips insights_function invocations whose latest lifecycle row is still running', async () => {
        stubPage(['inv-running', 'inv-done'])
        // Kafka has no conflict guard, so re-enqueuing an in-flight invocation
        // would double its side effects — skip the one CH reports as running.
        jest.spyOn(paginator as any, 'fetchRunningInvocationIds').mockResolvedValue(new Set(['inv-running']))

        const { state: next } = await runPage(buildState('insights_function'))

        expect(hogQueue.queueInvocations).toHaveBeenCalledTimes(1)
        expect((hogQueue.queueInvocations.mock.calls[0][0] as any[]).map((i) => i.id)).toEqual(['inv-done'])
        expect((paginator as any).invocationResultsRowsService.dropQueuedRowsFor).toHaveBeenCalledWith(['inv-running'])
        expect(next.progress.queued).toBe(1)
        expect(next.progress.skipped).toBe(1)
    })

    it('does not enqueue on the script path when every invocation is still in-flight', async () => {
        stubPage(['inv-running'])
        jest.spyOn(paginator as any, 'fetchRunningInvocationIds').mockResolvedValue(new Set(['inv-running']))

        const { state: next } = await runPage(buildState('insights_function'))

        expect(hogQueue.queueInvocations).not.toHaveBeenCalled()
        expect(next.progress.queued).toBe(0)
        expect(next.progress.skipped).toBe(1)
    })

    it('counts hogflow in-flight conflicts as skipped instead of failing the page', async () => {
        stubPage(['inv-conflict'])
        // The postgres-v2 upsert raises a conflict when the existing row is
        // still active — the paginator logs + counts it as a skip, not a failure.
        hogflowQueue.queueInvocations.mockRejectedValueOnce(new CyclotronJobConflictError('inv-conflict'))

        const { state: next } = await runPage(buildState('hog_flow'))

        expect(next.progress.queued).toBe(0)
        expect(next.progress.skipped).toBe(1)
        expect(next.progress.last_error).toBeUndefined()
    })

    const rehydrate = (type: string) => {
        const insightsFunctionManager = {
            getInsightsFunction: jest.fn().mockResolvedValue({ id: 'fn-1', team_id: 1, type }),
        } as unknown as InsightsFunctionManagerService
        const webhookPaginator = new RerunPaginatorService(
            {} as any,
            insightsFunctionManager,
            {} as unknown as InsightsFlowManagerService,
            {} as unknown as HogInvocationResultsService,
            { insights_function: hogQueue, hog_flow: hogflowQueue },
            {} as unknown as InsightsFunctionMonitoringService,
            10000
        )
        const row = {
            invocation_id: 'inv-1',
            parent_run_id: '',
            attempts: 0,
            last_scheduled_at: '2026-01-01 00:00:00',
            first_scheduled_at: '2026-01-01 00:00:00',
            // Well-formed globals so the rerunnable-type cases pass rehydration's
            // schema validation — the type gate is what these tests exercise.
            invocation_globals: JSON.stringify({
                project: { id: 1, name: '', url: '' },
                event: { uuid: 'e1', distinct_id: 'd1', properties: {} },
            }),
        }
        return (webhookPaginator as any).rehydrateInvocation(1, 'insights_function', 'fn-1', row)
    }

    // A cyclotron worker only executes destinations. Re-enqueuing a source webhook (or any
    // other type) onto the script queue wedges the partition, since nothing there can run it.
    // rehydrateInvocation must return null so the row is counted as skipped, not queued.
    it.each(['source_webhook', 'warehouse_source_webhook', 'transformation', 'site_destination', 'site_app'])(
        'skips rerun of non-rerunnable type %s',
        async (type) => {
            expect(await rehydrate(type)).toBeNull()
        }
    )

    it.each(['destination', 'internal_destination'])('rehydrates rerunnable type %s', async (type) => {
        const invocation = await rehydrate(type)
        expect(invocation).not.toBeNull()
        expect(invocation.queue).toBe('script')
    })
})

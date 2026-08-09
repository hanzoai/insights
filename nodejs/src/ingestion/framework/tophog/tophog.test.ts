import { TOPFN_OUTPUT, TopFnOutput } from '~/common/outputs'
import { IngestionOutputs } from '~/common/outputs/ingestion-outputs'
import { parseJSON } from '~/common/utils/json-parse'

import { TopFn, TopFnOptionalConfig, TopFnRequiredConfig } from './topfn'

describe('TopFn', () => {
    let mockQueueMessages: jest.Mock
    let mockOutputs: IngestionOutputs<TopFnOutput>

    beforeEach(() => {
        jest.useFakeTimers({ now: new Date('2025-01-15T10:30:00.000Z') })
        mockQueueMessages = jest.fn().mockResolvedValue(undefined)
        mockOutputs = { queueMessages: mockQueueMessages } as unknown as IngestionOutputs<TopFnOutput>
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    function createOptions(
        overrides: Partial<TopFnRequiredConfig & TopFnOptionalConfig> = {}
    ): TopFnRequiredConfig & Partial<TopFnOptionalConfig> {
        return {
            outputs: mockOutputs,
            pipeline: 'test_pipeline',
            lane: 'test_lane',
            ...overrides,
        }
    }

    function getProducedMessages(): any[] {
        if (mockQueueMessages.mock.calls.length === 0) {
            return []
        }
        return mockQueueMessages.mock.calls.flatMap((call: any) =>
            call[1].map((m: any) => parseJSON(m.value.toString()))
        )
    }

    describe('tracker registry', () => {
        it('should return the same sum tracker instance for the same name', () => {
            const topfn = new TopFn(createOptions())
            const a = topfn.registerSum('events')
            const b = topfn.registerSum('events')
            expect(a).toBe(b)
        })

        it('should return different tracker instances for different names', () => {
            const topfn = new TopFn(createOptions())
            const a = topfn.registerSum('events')
            const b = topfn.registerSum('heatmaps')
            expect(a).not.toBe(b)
        })

        it('should store metric name as given', () => {
            const topfn = new TopFn(createOptions())
            expect(topfn.registerSum('events').metricName).toBe('events')
            expect(topfn.registerSum('latency').metricName).toBe('latency')
        })

        it('should return the same average tracker instance for the same name', () => {
            const topfn = new TopFn(createOptions())
            const a = topfn.registerAverage('latency')
            const b = topfn.registerAverage('latency')
            expect(a).toBe(b)
        })

        it('should return the same max tracker instance for the same name', () => {
            const topfn = new TopFn(createOptions())
            const a = topfn.registerMax('max_size')
            const b = topfn.registerMax('max_size')
            expect(a).toBe(b)
        })

        it('should return independent trackers for the same name across different types', () => {
            const topfn = new TopFn(createOptions())
            const sum = topfn.registerSum('latency')
            const max = topfn.registerMax('latency')
            const avg = topfn.registerAverage('latency')
            expect(sum).not.toBe(max)
            expect(sum).not.toBe(avg)
            expect(max).not.toBe(avg)
        })
    })

    describe('flush collects from all trackers', () => {
        it('should produce messages from trackers', async () => {
            const topfn = new TopFn(createOptions())
            topfn.registerSum('events').record({ team_id: '42' }, 5)

            await topfn.flush()

            expect(getProducedMessages()).toEqual([
                {
                    timestamp: '2025-01-15T10:30:00.000Z',
                    metric: 'events',
                    type: 'sum',
                    key: { team_id: '42' },
                    value: 5,
                    count: 1,
                    pipeline: 'test_pipeline',
                    lane: 'test_lane',
                    labels: {},
                },
            ])
        })

        it('should include type=sum for sum trackers', async () => {
            const topfn = new TopFn(createOptions())
            topfn.registerSum('events').record({ team_id: '1' }, 5)

            await topfn.flush()

            const msg = getProducedMessages()[0]
            expect(msg.type).toBe('sum')
            expect(msg.value).toBe(5)
            expect(msg.count).toBe(1)
        })

        it('should include type=max for max trackers', async () => {
            const topfn = new TopFn(createOptions())
            topfn.registerMax('max_size').record({ team_id: '1' }, 100)

            await topfn.flush()

            const msg = getProducedMessages()[0]
            expect(msg.type).toBe('max')
            expect(msg.value).toBe(100)
            expect(msg.count).toBe(1)
        })

        it('should include type=avg for average trackers', async () => {
            const topfn = new TopFn(createOptions())
            const tracker = topfn.registerAverage('latency')
            tracker.record({ team_id: '1' }, 10)
            tracker.record({ team_id: '1' }, 30)

            await topfn.flush()

            const msg = getProducedMessages()[0]
            expect(msg.type).toBe('avg')
            expect(msg.value).toBe(20)
            expect(msg.count).toBe(2)
        })

        it('should collect entries from mixed tracker types in a single flush', async () => {
            const topfn = new TopFn(createOptions())
            topfn.registerSum('events').record({ team_id: '1' }, 10)
            topfn.registerMax('max_size').record({ team_id: '1' }, 500)
            topfn.registerAverage('avg_latency').record({ team_id: '1' }, 30)

            await topfn.flush()

            const messages = getProducedMessages()
            expect(messages).toHaveLength(3)
            expect(messages.find((m) => m.metric === 'events')).toMatchObject({ type: 'sum', value: 10 })
            expect(messages.find((m) => m.metric === 'max_size')).toMatchObject({ type: 'max', value: 500 })
            expect(messages.find((m) => m.metric === 'avg_latency')).toMatchObject({ type: 'avg', value: 30 })
        })

        it('should flush same-named metrics across different types independently', async () => {
            const topfn = new TopFn(createOptions())
            topfn.registerSum('latency').record({ team_id: '1' }, 10)
            topfn.registerSum('latency').record({ team_id: '1' }, 20)
            topfn.registerMax('latency').record({ team_id: '1' }, 10)
            topfn.registerMax('latency').record({ team_id: '1' }, 20)
            topfn.registerAverage('latency').record({ team_id: '1' }, 10)
            topfn.registerAverage('latency').record({ team_id: '1' }, 20)

            await topfn.flush()

            const messages = getProducedMessages()
            expect(messages).toHaveLength(3)
            expect(messages.find((m) => m.type === 'sum')).toMatchObject({ metric: 'latency', value: 30, count: 2 })
            expect(messages.find((m) => m.type === 'max')).toMatchObject({ metric: 'latency', value: 20, count: 2 })
            expect(messages.find((m) => m.type === 'avg')).toMatchObject({ metric: 'latency', value: 15, count: 2 })
        })

        it('should not produce when there is no data', async () => {
            const topfn = new TopFn(createOptions())

            await topfn.flush()

            expect(mockQueueMessages).not.toHaveBeenCalled()
        })

        it('should clear all trackers after flush', async () => {
            const topfn = new TopFn(createOptions())
            topfn.registerSum('events').record({ team_id: '1' }, 10)

            await topfn.flush()
            await topfn.flush()

            expect(mockQueueMessages).toHaveBeenCalledTimes(1)
        })

        it('should include labels in flushed messages', async () => {
            const topfn = new TopFn(createOptions({ labels: { hostname: 'worker-1', region: 'us-east' } }))
            topfn.registerSum('events').record({ team_id: '1' }, 1)

            await topfn.flush()

            expect(getProducedMessages()[0].labels).toEqual({ hostname: 'worker-1', region: 'us-east' })
        })

        it('should include pipeline and lane in every message', async () => {
            const topfn = new TopFn(createOptions({ pipeline: 'analytics', lane: 'heatmap' }))
            topfn.registerSum('events').record({ team_id: '1' }, 1)

            await topfn.flush()

            const messages = getProducedMessages()
            expect(messages[0].pipeline).toBe('analytics')
            expect(messages[0].lane).toBe('heatmap')
        })

        it('should produce to the topfn output', async () => {
            const topfn = new TopFn(createOptions())
            topfn.registerSum('events').record({ team_id: '1' }, 1)

            await topfn.flush()

            expect(mockQueueMessages).toHaveBeenCalledWith(TOPFN_OUTPUT, expect.any(Array))
        })
    })

    describe('start and stop', () => {
        it('should flush periodically after start', async () => {
            const topfn = new TopFn(createOptions({ flushIntervalMs: 1000 }))
            topfn.start()

            topfn.registerSum('metric').record({ id: 'k' }, 1)
            jest.advanceTimersByTime(1000)

            expect(mockQueueMessages).toHaveBeenCalledTimes(1)

            topfn.registerSum('metric').record({ id: 'k' }, 2)
            jest.advanceTimersByTime(1000)

            expect(mockQueueMessages).toHaveBeenCalledTimes(2)

            await topfn.stop()
        })

        it('should perform a final flush on stop', async () => {
            const topfn = new TopFn(createOptions({ flushIntervalMs: 60_000 }))
            topfn.start()
            topfn.registerSum('metric').record({ id: 'k' }, 5)

            await topfn.stop()

            expect(mockQueueMessages).toHaveBeenCalledTimes(1)
        })

        it('should not flush periodically after stop', async () => {
            const topfn = new TopFn(createOptions({ flushIntervalMs: 1000 }))
            topfn.start()
            await topfn.stop()

            topfn.registerSum('metric').record({ id: 'k' }, 1)
            jest.advanceTimersByTime(5000)

            expect(mockQueueMessages).toHaveBeenCalledTimes(0)
        })

        it('should not start multiple intervals', () => {
            const topfn = new TopFn(createOptions({ flushIntervalMs: 1000 }))
            topfn.start()
            topfn.start()

            topfn.registerSum('metric').record({ id: 'k' }, 1)
            jest.advanceTimersByTime(1000)

            expect(mockQueueMessages).toHaveBeenCalledTimes(1)
        })

        it('should work without calling start (manual flush only)', async () => {
            const topfn = new TopFn(createOptions())
            topfn.registerSum('metric').record({ id: 'k' }, 1)

            await topfn.flush()

            expect(mockQueueMessages).toHaveBeenCalledTimes(1)
        })

        it('should flush on stop even if start was never called', async () => {
            const topfn = new TopFn(createOptions())
            topfn.registerSum('metric').record({ id: 'k' }, 1)

            await topfn.stop()

            expect(mockQueueMessages).toHaveBeenCalledTimes(1)
        })
    })
})

import { newPipelineBuilder } from '~/ingestion/framework/builders/helpers'
import { createOkContext } from '~/ingestion/framework/helpers'
import { PipelineResult, dlq, isOkResult, ok } from '~/ingestion/framework/results'

import {
    TopFnRegistry,
    average,
    averageOk,
    averageResult,
    count,
    countOk,
    countResult,
    createTopFnWrapper,
    max,
    maxOk,
    maxResult,
    sum,
    sumOk,
    sumResult,
    timer,
} from './topfn'

describe('topFn wrapper', () => {
    function createMockTopFn(): TopFnRegistry & {
        record: jest.Mock
        registerSum: jest.Mock
        registerMax: jest.Mock
        registerAverage: jest.Mock
    } {
        const record = jest.fn()
        const registerSum = jest.fn().mockReturnValue({ record })
        const registerMax = jest.fn().mockReturnValue({ record })
        const registerAverage = jest.fn().mockReturnValue({ record })
        return { record, registerSum, registerMax, registerAverage }
    }

    it('should record count metric on OK result', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function myStep(_input: { teamId: number }) {
            return Promise.resolve(ok({ processed: true }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(topFn(myStep, [count('events', (input) => ({ team_id: String(input.teamId) }))]))
            .build()

        await pipeline.process(createOkContext({ teamId: 42 }, {}))

        expect(mockTracker.registerSum).toHaveBeenCalledWith('events', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '42' }, 1)
    })

    it('should record time metric on OK result', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function myStep(_input: { teamId: number }) {
            return Promise.resolve(ok({ processed: true }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(topFn(myStep, [timer('events', (input) => ({ team_id: String(input.teamId) }))]))
            .build()

        await pipeline.process(createOkContext({ teamId: 42 }, {}))

        expect(mockTracker.registerSum).toHaveBeenCalledWith('events', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '42' }, expect.any(Number))
    })

    it('should track multiple metrics with different keys', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function myStep(_input: { teamId: number; userId: string }) {
            return Promise.resolve(ok({ processed: true }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number; userId: string }>()
            .pipe(
                topFn(myStep, [
                    count('by_team', (input) => ({ team_id: String(input.teamId) })),
                    timer('by_user', (input) => ({ user_id: input.userId })),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 42, userId: 'u_1' }, {}))

        expect(mockTracker.registerSum).toHaveBeenCalledWith('by_team', undefined)
        expect(mockTracker.registerSum).toHaveBeenCalledWith('by_user', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '42' }, 1)
        expect(mockTracker.record).toHaveBeenCalledWith({ user_id: 'u_1' }, expect.any(Number))
    })

    it('should use custom metric name when provided', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)
        const step = jest.fn().mockResolvedValue(ok({ done: true }))

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(topFn(step, [count('heatmap_events', (input) => ({ team_id: String(input.teamId) }))]))
            .build()

        await pipeline.process(createOkContext({ teamId: 7 }, {}))

        expect(mockTracker.registerSum).toHaveBeenCalledWith('heatmap_events', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '7' }, 1)
    })

    it('should track even on non-OK results from step', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)
        const step = jest.fn().mockResolvedValue(dlq('bad data'))

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(topFn(step, [count('events', (input) => ({ team_id: String(input.teamId) }))]))
            .build()

        await pipeline.process(createOkContext({ teamId: 1 }, {}))

        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '1' }, 1)
    })

    it('should not track when descriptors are empty', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)
        const step = jest.fn().mockResolvedValue(ok({ done: true }))

        const pipeline = newPipelineBuilder<{ teamId: number }>().pipe(topFn(step, [])).build()

        await pipeline.process(createOkContext({ teamId: 1 }, {}))

        expect(step).toHaveBeenCalled()
        expect(mockTracker.registerSum).not.toHaveBeenCalled()
    })

    it('should preserve step name on wrapped function', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function namedStep(_input: { teamId: number }) {
            return Promise.resolve(ok({ processed: true }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(topFn(namedStep, [count('events', (input) => ({ team_id: String(input.teamId) }))]))
            .build()

        const result = await pipeline.process(createOkContext({ teamId: 5 }, {}))

        expect(result.context.lastStep).toBe('namedStep')
    })

    it('should not interfere with step result or context propagation', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function trackedStep(input: { teamId: number }) {
            return Promise.resolve(ok({ processed: input.teamId }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(topFn(trackedStep, [count('events', (input) => ({ team_id: String(input.teamId) }))]))
            .build()

        const result = await pipeline.process(createOkContext({ teamId: 5 }, {}))

        expect(isOkResult(result.result)).toBe(true)
        if (isOkResult(result.result)) {
            expect(result.result.value).toEqual({ processed: 5 })
        }
        expect(result.context.lastStep).toBe('trackedStep')
    })

    it('should record sum metric with custom value', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function myStep(_input: { teamId: number; size: number }) {
            return Promise.resolve(ok({ done: true }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number; size: number }>()
            .pipe(
                topFn(myStep, [
                    sum(
                        'total_bytes',
                        (input) => ({ team_id: String(input.teamId) }),
                        (input) => input.size
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 42, size: 1024 }, {}))

        expect(mockTracker.registerSum).toHaveBeenCalledWith('total_bytes', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '42' }, 1024)
    })

    it('should record sumResult metric on OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function myStep(_input: { teamId: number; size: number }) {
            return Promise.resolve(ok({ done: true }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number; size: number }>()
            .pipe(
                topFn(myStep, [
                    sumResult(
                        'total_bytes',
                        (_result, input) => ({ team_id: String(input.teamId) }),
                        (_result, input) => input.size
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 42, size: 1024 }, {}))

        expect(mockTracker.registerSum).toHaveBeenCalledWith('total_bytes', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '42' }, 1024)
    })

    it('should record sumResult metric on non-OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)
        const step = jest.fn().mockResolvedValue(dlq('bad data'))

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(
                topFn(step, [
                    sumResult(
                        'total_bytes',
                        (_result: PipelineResult<unknown, string>, input) => ({ team_id: String(input.teamId) }),
                        () => 100
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 1 }, {}))

        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '1' }, 100)
    })

    it('should record sumOk metric only on OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function myStep(_input: { teamId: number }) {
            return Promise.resolve(ok({ bytes: 2048 }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(
                topFn(myStep, [
                    sumOk(
                        'output_bytes',
                        (output) => ({ bytes: String(output.bytes) }),
                        (output) => output.bytes
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 42 }, {}))

        expect(mockTracker.registerSum).toHaveBeenCalledWith('output_bytes', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ bytes: '2048' }, 2048)
    })

    it('should not record sumOk on non-OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)
        const step = jest.fn().mockResolvedValue(dlq('bad data'))

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(
                topFn(step, [
                    sumOk(
                        'output_bytes',
                        (_output: { bytes: number }) => ({ team_id: '1' }),
                        (output) => output.bytes
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 1 }, {}))

        expect(mockTracker.record).not.toHaveBeenCalled()
    })

    it('should record countResult metric on OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function myStep(_input: { teamId: number }) {
            return Promise.resolve(ok({ done: true }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(topFn(myStep, [countResult('processed', (_result, input) => ({ team_id: String(input.teamId) }))]))
            .build()

        await pipeline.process(createOkContext({ teamId: 42 }, {}))

        expect(mockTracker.registerSum).toHaveBeenCalledWith('processed', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '42' }, 1)
    })

    it('should record countResult metric on non-OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)
        const step = jest.fn().mockResolvedValue(dlq('bad data'))

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(
                topFn(step, [
                    countResult('processed', (_result: PipelineResult<unknown, string>, input) => ({
                        team_id: String(input.teamId),
                    })),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 1 }, {}))

        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '1' }, 1)
    })

    it('should record countOk metric only on OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function myStep(_input: { teamId: number }) {
            return Promise.resolve(ok({ done: true }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(topFn(myStep, [countOk('processed', (output, input) => ({ team_id: String(input.teamId) }))]))
            .build()

        await pipeline.process(createOkContext({ teamId: 42 }, {}))

        expect(mockTracker.registerSum).toHaveBeenCalledWith('processed', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '42' }, 1)
    })

    it('should not record countOk on non-OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)
        const step = jest.fn().mockResolvedValue(dlq('bad data'))

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(
                topFn(step, [countOk('processed', (_output: unknown, input) => ({ team_id: String(input.teamId) }))])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 1 }, {}))

        expect(mockTracker.record).not.toHaveBeenCalled()
    })

    it('should record average metric before step returns', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function myStep(_input: { teamId: number; size: number }) {
            return Promise.resolve(ok({ done: true }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number; size: number }>()
            .pipe(
                topFn(myStep, [
                    average(
                        'avg_size',
                        (input) => ({ team_id: String(input.teamId) }),
                        (input) => input.size
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 42, size: 1024 }, {}))

        expect(mockTracker.registerAverage).toHaveBeenCalledWith('avg_size', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '42' }, 1024)
    })

    it('should record averageResult metric on OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function myStep(_input: { teamId: number; size: number }) {
            return Promise.resolve(ok({ done: true }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number; size: number }>()
            .pipe(
                topFn(myStep, [
                    averageResult(
                        'avg_size',
                        (_result, input) => ({ team_id: String(input.teamId) }),
                        (_result, input) => input.size
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 42, size: 1024 }, {}))

        expect(mockTracker.registerAverage).toHaveBeenCalledWith('avg_size', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '42' }, 1024)
    })

    it('should record averageResult metric on non-OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)
        const step = jest.fn().mockResolvedValue(dlq('bad data'))

        const pipeline = newPipelineBuilder<{ teamId: number; size: number }>()
            .pipe(
                topFn(step, [
                    averageResult(
                        'avg_size',
                        (_result: PipelineResult<unknown, string>, input) => ({ team_id: String(input.teamId) }),
                        (_result: PipelineResult<unknown, string>, input) => input.size
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 1, size: 512 }, {}))

        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '1' }, 512)
    })

    it('should record averageOk metric only on OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function myStep(_input: { teamId: number }) {
            return Promise.resolve(ok({ count: 5 }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(
                topFn(myStep, [
                    averageOk(
                        'avg_count',
                        (output) => ({ count: String(output.count) }),
                        (output) => output.count
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 42 }, {}))

        expect(mockTracker.registerAverage).toHaveBeenCalledWith('avg_count', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ count: '5' }, 5)
    })

    it('should not record averageOk on non-OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)
        const step = jest.fn().mockResolvedValue(dlq('bad data'))

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(
                topFn(step, [
                    averageOk(
                        'avg_count',
                        (_output: { count: number }) => ({ team_id: '1' }),
                        (output) => output.count
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 1 }, {}))

        expect(mockTracker.record).not.toHaveBeenCalled()
    })

    it('should record max metric before step returns', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function myStep(_input: { teamId: number; size: number }) {
            return Promise.resolve(ok({ done: true }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number; size: number }>()
            .pipe(
                topFn(myStep, [
                    max(
                        'max_size',
                        (input) => ({ team_id: String(input.teamId) }),
                        (input) => input.size
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 42, size: 2048 }, {}))

        expect(mockTracker.registerMax).toHaveBeenCalledWith('max_size', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '42' }, 2048)
    })

    it('should record maxResult metric on OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function myStep(_input: { teamId: number; size: number }) {
            return Promise.resolve(ok({ done: true }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number; size: number }>()
            .pipe(
                topFn(myStep, [
                    maxResult(
                        'max_size',
                        (_result, input) => ({ team_id: String(input.teamId) }),
                        (_result, input) => input.size
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 42, size: 2048 }, {}))

        expect(mockTracker.registerMax).toHaveBeenCalledWith('max_size', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '42' }, 2048)
    })

    it('should record maxResult metric on non-OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)
        const step = jest.fn().mockResolvedValue(dlq('bad data'))

        const pipeline = newPipelineBuilder<{ teamId: number; size: number }>()
            .pipe(
                topFn(step, [
                    maxResult(
                        'max_size',
                        (_result: PipelineResult<unknown, string>, input) => ({ team_id: String(input.teamId) }),
                        (_result: PipelineResult<unknown, string>, input) => input.size
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 1, size: 512 }, {}))

        expect(mockTracker.record).toHaveBeenCalledWith({ team_id: '1' }, 512)
    })

    it('should record maxOk metric only on OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)

        function myStep(_input: { teamId: number }) {
            return Promise.resolve(ok({ size: 512 }))
        }

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(
                topFn(myStep, [
                    maxOk(
                        'max_output_size',
                        (output) => ({ size: String(output.size) }),
                        (output) => output.size
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 42 }, {}))

        expect(mockTracker.registerMax).toHaveBeenCalledWith('max_output_size', undefined)
        expect(mockTracker.record).toHaveBeenCalledWith({ size: '512' }, 512)
    })

    it('should not record maxOk on non-OK results', async () => {
        const mockTracker = createMockTopFn()
        const topFn = createTopFnWrapper(mockTracker)
        const step = jest.fn().mockResolvedValue(dlq('bad data'))

        const pipeline = newPipelineBuilder<{ teamId: number }>()
            .pipe(
                topFn(step, [
                    maxOk(
                        'max_size',
                        (_output: { size: number }) => ({ team_id: '1' }),
                        (output) => output.size
                    ),
                ])
            )
            .build()

        await pipeline.process(createOkContext({ teamId: 1 }, {}))

        expect(mockTracker.record).not.toHaveBeenCalled()
    })
})
